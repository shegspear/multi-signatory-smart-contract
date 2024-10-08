// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Multisig {
    uint8 public quorum;
    uint8 public noOfValidSigners;
    uint256 public txCount;
    uint256 public quorumCount;
    address public owner;
    uint8 public noOfApprovers; 

    struct Transaction {
        uint256 id;
        uint256 amount;
        address sender;
        address recipient;
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        address tokenAddress;
        address[] transactionSigners;
    }

    struct Quorum {
       uint256 id;
       uint256 amount; 
       address sender;
       bool isCompleted;
       uint256 timestamp;
       uint256 noOfApproval;
       address[] transactionSigners;
    }

    mapping(address => bool) public isValidSigner;
    mapping(uint => Transaction) transactions; // txId -> Transaction
    // signer -> transactionId -> bool (checking if an address has signed)
    mapping(address => mapping(uint256 => bool)) hasSigned;
    
    mapping(uint => Quorum) public quorums;
    mapping(address => mapping(uint256 => bool)) public hasApprovedUpdate;

    constructor(uint8 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        require(_quorum > 1, "quorum is too small");

        owner = msg.sender;


        for(uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed");
            require(!isValidSigner[_validSigners[i]], "signer already exist");

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = uint8(_validSigners.length);

        if (!isValidSigner[msg.sender]){
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        require(_quorum <= noOfValidSigners, "quorum greater than valid signers");
        quorum = _quorum;
    }

    function transfer(uint256 _amount, address _recipient, address _tokenAddress) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];
        
        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);
        hasSigned[msg.sender][_txId] = true;

        txCount += 1;
    }

    function approveTx(uint8 _txId) external {
        Transaction storage trx = transactions[_txId];

        require(trx.id != 0, "invalid tx id");
        
        require(IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount, "insufficient funds");
        require(!trx.isCompleted, "transaction already completed");
        require(trx.noOfApproval < quorum, "approvals already reached");

        // for(uint256 i = 0; i < trx.transactionSigners.length; i++) {
        //     if(trx.transactionSigners[i] == msg.sender) {
        //         revert("can't sign twice");
        //     }
        // }

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        if(trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
        }
    }

    function updateQuorumRequest(uint256 _amount) external {
        require(msg.sender != address(0), "village people");
        require(isValidSigner[msg.sender], "ogbeni shift");

        require(_amount > 0, "are you that broke");

        uint256 _quorumId = quorumCount + 1;
        Quorum storage _quorum = quorums[_quorumId];

        _quorum.id = _quorumId;
        _quorum.amount = _amount;
        _quorum.sender = msg.sender;
        _quorum.timestamp = block.timestamp;
        _quorum.noOfApproval += 1;
        _quorum.transactionSigners.push(msg.sender);
        hasApprovedUpdate[msg.sender][_quorumId] = true;

        quorumCount += 1;
    }

    function approveQuorumUpdate(uint256 _quorumId) external returns(uint8) {
        Quorum storage _quorum = quorums[_quorumId];

        require(_quorum.id != 0, "your papa");

        require(!_quorum.isCompleted, "transaction already completed");
        require(_quorum.noOfApproval < quorum, "approvals already reached");

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasApprovedUpdate[msg.sender][_quorumId], "can't sign twice");

        hasApprovedUpdate[msg.sender][_quorumId] = true;
        _quorum.noOfApproval += 1;
        _quorum.transactionSigners.push(msg.sender);

        noOfApprovers += 1;

        if(_quorum.noOfApproval == quorum) {
            _quorum.isCompleted = true;
            quorum = uint8(_quorum.amount);
        }

        return noOfApprovers;
    }

}
