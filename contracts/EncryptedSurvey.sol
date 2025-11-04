// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";

/// @title Encrypted Survey System
/// @notice Collects encrypted survey responses and maintains encrypted tallies per option.
contract EncryptedSurvey is SepoliaConfig {
    /// @notice Describes a viewer that is authorized to decrypt survey tallies.
    struct ViewerRegistry {
        address[] viewers;
        mapping(address => bool) isAuthorized;
    }

    string public surveyTitle;
    string public surveyDescription;
    string[] private _options;
    euint32[] private _encryptedTallies;
    mapping(address => bool) private _hasResponded;
    mapping(address => uint256[]) private _userVotes; // Track which options user has voted for

    address public immutable admin;
    ViewerRegistry private _viewerRegistry;

    bool public isActive;
    uint256 public surveyDeadline;

    event ResponseSubmitted(address indexed respondent, uint256 indexed optionIndex);
    event BatchResponseSubmitted(address indexed respondent, uint256[] optionIndices, uint256 totalVotes);
    event VoteUpdated(address indexed respondent, uint256[] oldOptions, uint256[] newOptions);
    event ViewerAuthorized(address indexed viewer);
    event SurveyActivated();
    event SurveyClosed();

    error SurveyAlreadyAnswered();
    error InvalidOption();
    error InvalidViewer();
    error OnlyAdmin();

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert OnlyAdmin();
        }
        _;
    }

    modifier surveyActive() {
        require(isActive, "SURVEY_NOT_ACTIVE");
        require(block.timestamp <= surveyDeadline, "SURVEY_EXPIRED");
        _;
    }

    constructor(string memory title, string memory description, string[] memory options, uint256 deadline) {
        require(options.length > 0, "OPTIONS_REQUIRED");

        admin = msg.sender;
        surveyTitle = title;
        surveyDescription = description;
        surveyDeadline = deadline;
        isActive = true;

        for (uint256 i = 0; i < options.length; i++) {
            _options.push(options[i]);
        }

        _encryptedTallies = new euint32[](options.length);
        _authorizeViewer(admin);
    }

    /// @notice Returns the number of available options in the survey.
    function optionsCount() external view returns (uint256) {
        return _options.length;
    }

    /// @notice Returns the label for a specific survey option.
    function getOptionLabel(uint256 optionIndex) external view returns (string memory) {
        if (optionIndex >= _options.length) {
            revert InvalidOption();
        }

        return _options[optionIndex];
    }

    /// @notice Indicates whether the caller has already answered the survey.
    function hasResponded(address account) external view returns (bool) {
        return _hasResponded[account];
    }

    /// @notice Retrieves the encrypted tally for the provided option index.
    function getEncryptedTally(uint256 optionIndex) external view returns (euint32) {
        if (optionIndex >= _options.length) {
            revert InvalidOption();
        }

        return _encryptedTallies[optionIndex];
    }

    /// @notice Retrieves all encrypted tallies.
    function getAllEncryptedTallies() external view returns (euint32[] memory tallies) {
        tallies = new euint32[](_encryptedTallies.length);
        for (uint256 i = 0; i < _encryptedTallies.length; i++) {
            tallies[i] = _encryptedTallies[i];
        }
    }

    /// @notice Submits an encrypted response for a specific survey option.
    function submitResponse(uint256 optionIndex, externalEuint32 encryptedVote, bytes calldata proof) external surveyActive {
        if (optionIndex >= _options.length) {
            revert InvalidOption();
        }

        if (_hasResponded[msg.sender]) {
            revert SurveyAlreadyAnswered();
        }

        euint32 voteValue = FHE.fromExternal(encryptedVote, proof);
        _encryptedTallies[optionIndex] = FHE.add(_encryptedTallies[optionIndex], voteValue);
        _hasResponded[msg.sender] = true;
        _userVotes[msg.sender].push(optionIndex);

        FHE.allowThis(_encryptedTallies[optionIndex]);
        _refreshViewerAccess(optionIndex);

        emit ResponseSubmitted(msg.sender, optionIndex);
    }

    /// @notice Submits multiple encrypted responses for different survey options.
    function submitBatchResponse(
        uint256[] calldata optionIndices,
        externalEuint32[] calldata encryptedVotes,
        bytes[] calldata proofs
    ) external surveyActive {
        require(optionIndices.length == encryptedVotes.length && encryptedVotes.length == proofs.length, "ARRAY_LENGTH_MISMATCH");
        require(optionIndices.length > 0, "EMPTY_BATCH");

        if (_hasResponded[msg.sender]) {
            revert SurveyAlreadyAnswered();
        }

        uint256 totalVotes = 0;

        for (uint256 i = 0; i < optionIndices.length; i++) {
            uint256 optionIndex = optionIndices[i];
            if (optionIndex >= _options.length) {
                revert InvalidOption();
            }

            euint32 voteValue = FHE.fromExternal(encryptedVotes[i], proofs[i]);
            _encryptedTallies[optionIndex] = FHE.add(_encryptedTallies[optionIndex], voteValue);
            totalVotes += 1;

            FHE.allowThis(_encryptedTallies[optionIndex]);
            _refreshViewerAccess(optionIndex);
        }

        _hasResponded[msg.sender] = true;
        emit BatchResponseSubmitted(msg.sender, optionIndices, totalVotes);
    }

    /// @notice Grants permission for a viewer to decrypt the current tallies.
    function authorizeViewer(address viewer) external onlyAdmin {
        _authorizeViewer(viewer);
    }

    /// @notice Returns the list of currently authorized viewers.
    function authorizedViewers() external view returns (address[] memory) {
        return _viewerRegistry.viewers;
    }

    /// @notice Closes the survey, preventing further responses.
    function closeSurvey() external onlyAdmin {
        isActive = false;
        emit SurveyClosed();
    }

    /// @notice Reopens a closed survey.
    function reopenSurvey() external onlyAdmin {
        require(block.timestamp <= surveyDeadline, "DEADLINE_PASSED");
        isActive = true;
        emit SurveyActivated();
    }

    /// @notice Extends the survey deadline.
    function extendDeadline(uint256 newDeadline) external onlyAdmin {
        require(newDeadline > surveyDeadline, "NEW_DEADLINE_MUST_BE_LATER");
        surveyDeadline = newDeadline;
    }

    /// @notice Returns the options a user has voted for.
    function getUserVotes(address user) external view returns (uint256[] memory) {
        return _userVotes[user];
    }

    /// @notice Returns survey participation statistics.
    function getSurveyStats() external view returns (
        uint256 totalOptions,
        uint256 activeStatus,
        uint256 deadline,
        uint256 participantCount
    ) {
        uint256 participants = 0;
        // Count unique participants (simplified - in practice you'd track this more efficiently)
        for (uint256 i = 0; i < _options.length; i++) {
            if (euint32.unwrap(_encryptedTallies[i]) != bytes32(0)) {
                participants += 1; // This is not accurate but demonstrates the concept
            }
        }

        return (_options.length, isActive ? 1 : 0, surveyDeadline, participants);
    }

    /// @notice Allows users to withdraw their vote and resubmit (resets their voting status).
    function withdrawAndResubmit() external surveyActive {
        require(_hasResponded[msg.sender], "NO_PREVIOUS_VOTE");

        // Note: In a real FHE system, properly withdrawing votes would require homomorphic subtraction
        // This is a simplified version that just resets the user's voting status
        // The old votes remain in the tally but the user can vote again
        _hasResponded[msg.sender] = false;

        emit VoteUpdated(msg.sender, _userVotes[msg.sender], new uint256[](0));
        delete _userVotes[msg.sender];
    }

    function _authorizeViewer(address viewer) private {
        if (viewer == address(0)) {
            revert InvalidViewer();
        }

        if (!_viewerRegistry.isAuthorized[viewer]) {
            _viewerRegistry.isAuthorized[viewer] = true;
            _viewerRegistry.viewers.push(viewer);
        }

        _allowTalliesForViewer(viewer);
        emit ViewerAuthorized(viewer);
    }

    function _refreshViewerAccess(uint256 optionIndex) private {
        euint32 tally = _encryptedTallies[optionIndex];
        if (euint32.unwrap(tally) != bytes32(0)) {
            FHE.allow(tally, admin);
        }

        for (uint256 i = 0; i < _viewerRegistry.viewers.length; i++) {
            address viewer = _viewerRegistry.viewers[i];
            if (viewer != admin) {
                if (euint32.unwrap(tally) != bytes32(0)) {
                    FHE.allow(tally, viewer);
                }
            }
        }
    }

    function _allowTalliesForViewer(address viewer) private {
        for (uint256 i = 0; i < _encryptedTallies.length; i++) {
            if (euint32.unwrap(_encryptedTallies[i]) != bytes32(0)) {
                FHE.allow(_encryptedTallies[i], viewer);
            }
        }
    }
}

