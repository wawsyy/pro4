
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const EncryptedSurveyABI = {
  "abi": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "options",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "InvalidOption",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidViewer",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "OnlyAdmin",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SurveyAlreadyAnswered",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "respondent",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "optionIndices",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalVotes",
          "type": "uint256"
        }
      ],
      "name": "BatchResponseSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "respondent",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "optionIndex",
          "type": "uint256"
        }
      ],
      "name": "ResponseSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "SurveyActivated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [],
      "name": "SurveyClosed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "ViewerAuthorized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "respondent",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "oldOptions",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "newOptions",
          "type": "uint256[]"
        }
      ],
      "name": "VoteUpdated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "admin",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "authorizeViewer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        },
        {
          "internalType": "enum EncryptedSurvey.ViewerRole",
          "name": "role",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "expiryTimestamp",
          "type": "uint256"
        }
      ],
      "name": "authorizeViewerWithRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "authorizedViewers",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "closeSurvey",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newDeadline",
          "type": "uint256"
        }
      ],
      "name": "extendDeadline",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllEncryptedTallies",
      "outputs": [
        {
          "internalType": "euint32[]",
          "name": "tallies",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "optionIndex",
          "type": "uint256"
        }
      ],
      "name": "getEncryptedTally",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "optionIndex",
          "type": "uint256"
        }
      ],
      "name": "getOptionLabel",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getResultSummary",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "optionIndices",
          "type": "uint256[]"
        },
        {
          "internalType": "string[]",
          "name": "optionLabels",
          "type": "string[]"
        },
        {
          "internalType": "uint256",
          "name": "totalParticipants",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getSurveyMetadata",
      "outputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "optionCount",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "active",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "adminAddr",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "viewerCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getSurveyStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalOptions",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "activeStatus",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "deadline",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "participantCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "count",
          "type": "uint256"
        }
      ],
      "name": "getTopOptions",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "topIndices",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserVotes",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "getViewerDetails",
      "outputs": [
        {
          "internalType": "bool",
          "name": "isAuthorized",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "role",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiry",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "hasAccess",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "hasResponded",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "hasValidAccess",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "isActive",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "optionsCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "reopenSurvey",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "viewer",
          "type": "address"
        }
      ],
      "name": "revokeViewer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256[]",
          "name": "optionIndices",
          "type": "uint256[]"
        },
        {
          "internalType": "externalEuint32[]",
          "name": "encryptedVotes",
          "type": "bytes32[]"
        },
        {
          "internalType": "bytes[]",
          "name": "proofs",
          "type": "bytes[]"
        }
      ],
      "name": "submitBatchResponse",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "optionIndex",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32",
          "name": "encryptedVote",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "submitResponse",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "surveyDeadline",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "surveyDescription",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "surveyTitle",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdrawAndResubmit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

