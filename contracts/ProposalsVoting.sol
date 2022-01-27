// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ProposalsVoting is Ownable {
    mapping(address => bool) public autorizedUsersToPropose;
    mapping(address => mapping(uint8 => bool)) public proposalAutorizarions;
    mapping(address => mapping(uint8 => bool)) public proposalUserVotes;
    string[] public proposals;
    mapping(uint8 => uint8) public votes;

    modifier onlyAutorizedToPropose() {
        require(autorizedUsersToPropose[msg.sender], "User is not autorized to propose");
        _;
    }

    modifier onlyAutorizedToVote(uint8 _proposal) {
        require(
            proposalAutorizarions[msg.sender][_proposal],
            "User is not autorized to vote in this Proposal"
        );
        _;
    }

    modifier justOneVoteByProposal(uint8 _proposal) {
      require(!proposalUserVotes[msg.sender][_proposal], "You have already voted");
      _;
    }
    /* this autorization is necessary to add proposal, user can vote if autorized vote even though don't can propose */
    function autorizePropose(address user) public onlyOwner {
        autorizedUsersToPropose[user] = true;
    }

    function includeProposal(string memory proposal)
        public
        onlyAutorizedToPropose
    {
        proposals.push(proposal);
    }

    /* this autorization to voto don't autorize add _proposal */
    function autorizeUserToVoteInProposal(uint8 _proposal, address _user)
        public
        onlyOwner
    {           
        require(_proposal <= (proposals.length-1), "This proposal not exist");
        proposalAutorizarions[_user][_proposal] = true;
    }

    function vote(uint8 _proposal) public onlyAutorizedToVote(_proposal) justOneVoteByProposal(_proposal) {
        votes[_proposal] += 1;
        proposalUserVotes[msg.sender][_proposal] = true;
    }
}

