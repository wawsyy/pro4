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

    address public immutable admin;
    ViewerRegistry private _viewerRegistry;

    event ResponseSubmitted(address indexed respondent, uint256 indexed optionIndex);
    event ViewerAuthorized(address indexed viewer);

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

    constructor(string memory title, string memory description, string[] memory options) {
        require(options.length > 0, "OPTIONS_REQUIRED");

        admin = msg.sender;
        surveyTitle = title;
        surveyDescription = description;

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
    function submitResponse(uint256 optionIndex, externalEuint32 encryptedVote, bytes calldata proof) external {
        if (optionIndex >= _options.length) {
            revert InvalidOption();
        }

        if (_hasResponded[msg.sender]) {
            revert SurveyAlreadyAnswered();
        }

        euint32 voteValue = FHE.fromExternal(encryptedVote, proof);
        _encryptedTallies[optionIndex] = FHE.add(_encryptedTallies[optionIndex], voteValue);
        _hasResponded[msg.sender] = true;

        FHE.allowThis(_encryptedTallies[optionIndex]);
        _refreshViewerAccess(optionIndex);

        emit ResponseSubmitted(msg.sender, optionIndex);
    }

    /// @notice Grants permission for a viewer to decrypt the current tallies.
    function authorizeViewer(address viewer) external onlyAdmin {
        _authorizeViewer(viewer);
    }

    /// @notice Returns the list of currently authorized viewers.
    function authorizedViewers() external view returns (address[] memory) {
        return _viewerRegistry.viewers;
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

