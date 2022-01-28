// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

struct Proposal {
    string proposal;
    uint256 votes;
}

contract ProposalsVoting is Ownable {
    mapping(address => bool) public autorizedUsersToPropose;
    mapping(address => mapping(uint256 => bool)) public proposalAutorizarions;
    mapping(address => mapping(uint256 => bool)) public proposalUserVotes;
    string[] public proposals;
    mapping(uint256 => uint256) public votes;

    event AutorizePropose(address user);
    event IncludeProposal(address user, string proposal);
    event AutorizeUserToVoteInProposal(address user, uint256 proposal);
    event Vote(address user, uint256 proposal);

    modifier onlyAutorizedToPropose() {
        require(
            autorizedUsersToPropose[msg.sender],
            "User is not autorized to propose"
        );
        _;
    }

    modifier onlyAutorizedToVote(uint256 _proposal) {
        require(
            proposalAutorizarions[msg.sender][_proposal],
            "User is not autorized to vote in this Proposal"
        );
        _;
    }

    modifier justOneVoteByProposal(uint256 _proposal) {
        require(
            !proposalUserVotes[msg.sender][_proposal],
            "You have already voted"
        );
        _;
    }

    /* this autorization is necessary to add proposal, user can vote if autorized vote even though don't can propose */
    function autorizePropose(address _user) public onlyOwner {
        autorizedUsersToPropose[_user] = true;
        emit AutorizePropose(_user);
    }

    function includeProposal(string memory _proposal)
        public
        onlyAutorizedToPropose
    {
        proposals.push(_proposal);
        emit IncludeProposal(msg.sender, _proposal);
    }

    /* this autorization to voto don't autorize add _proposal */
    function autorizeUserToVoteInProposal(uint256 _proposal, address _user)
        public
        onlyOwner
    {
        require(_proposal <= (proposals.length - 1), "This proposal not exist");
        proposalAutorizarions[_user][_proposal] = true;
        emit AutorizeUserToVoteInProposal(_user, _proposal);
    }

    function vote(uint256 _proposal)
        public
        onlyAutorizedToVote(_proposal)
        justOneVoteByProposal(_proposal)
    {
        votes[_proposal] += 1;
        proposalUserVotes[msg.sender][_proposal] = true;
        emit Vote(msg.sender, _proposal);
    }

    function getProposalVotes() public view returns (Proposal[] memory) {
        Proposal[] memory listProposals = new Proposal[](proposals.length);
        for (uint256 i = 0; i < proposals.length; i++) {
            listProposals[i] = Proposal(proposals[i], votes[i]);
        }
        return listProposals;
    }
}
