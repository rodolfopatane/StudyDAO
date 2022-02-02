// SPDX-License-Identifier: MIT

pragma solidity >=0.4.22 <0.9.0;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev System of propositions
 * This is not a poll, users can only vote YES or NO on proposals they have authorization
 * Management people can create proposes and autorized people can vote yes or no.
 * user can only vote on proposal in which he was authorized
 */
enum VoteOption {
    NONE,
    YES,
    NO
}

struct Proposal {
    address proposedBy;
    string proposalName;
    string proposalDescription;
    uint32 upVotes; // max votes 4294967296
    uint32 downVotes;
    bool openedToVote;
    bool closed; // never receive more votes
}

contract ProposalsVoting is Ownable {
    mapping(address => bool) public autorizedUsersToPropose; // people autorized to propose
    mapping(address => mapping(uint256 => bool)) public proposalAutorizations; // user can only vote on proposal in which he was authorized
    mapping(address => mapping(uint256 => VoteOption)) public proposalUserVotes; // how each user voted on each proposal
    Proposal[] public proposals; // all proposals and vote counts

    event AutorizePropose(address user);
    event IncludeProposal(address user, string proposal);
    event AutorizeUserToVoteInProposal(address user, uint256 proposal);
    event Vote(address user, uint256 proposal, VoteOption vote);

    modifier onlyAutorizedToPropose() {
        require(
            autorizedUsersToPropose[msg.sender],
            "User is not autorized to propose"
        );
        _;
    }

    modifier onlyAutorizedToVote(uint256 _proposal) {
        require(
            proposalAutorizations[msg.sender][_proposal],
            "User is not autorized to vote in this Proposal"
        );
        _;
    }

    modifier onlyOneVoteByProposal(uint256 _proposal) {
        require(
            proposalUserVotes[msg.sender][_proposal] != VoteOption.NONE,
            "You have already voted in this propose"
        );
        _;
    }

    modifier onlyWhoPropose(uint256 _proposal) {
        require(proposals[_proposal].proposedBy == msg.sender);
        _;
    }

    /* this authorization is necessary to add proposal */
    function autorizePropose(address[] memory _users) public onlyOwner {
        for (uint256 i = 0; i < _users.length; i++) {
            autorizedUsersToPropose[_users[i]] = true;
            emit AutorizePropose(_users[i]);
        }
    }

    function autorizePropose(address _user) public onlyOwner {
        autorizedUsersToPropose[_user] = true;
        emit AutorizePropose(_user);
    }

    function includeProposal(
        string memory _proposalName,
        string memory _proposalDescription
    ) public onlyAutorizedToPropose {
        proposals.push(
            Proposal(
                msg.sender,
                _proposalName,
                _proposalDescription,
                0,
                0,
                false,
                false
            )
        );
        emit IncludeProposal(msg.sender, _proposalName);
    }

    function startProposalVoting(uint256 _proposal)
        public
        onlyWhoPropose(_proposal)
    {
        require(
            !proposals[_proposal].closed,
            "Votation in this proposal is permanently closed"
        );
        proposals[_proposal].openedToVote = true;
    }

    function closeProposalVoting(uint256 _proposal)
        public
        onlyWhoPropose(_proposal)
    {
        proposals[_proposal].closed = true;
    }

    /* authorization to vote in specified proposal */
    function autorizeUserToVoteInProposal(uint256 _proposal, address _user)
        public
        onlyOwner
    {
        require(_proposal <= (proposals.length - 1), "This proposal not exist");
        proposalAutorizations[_user][_proposal] = true;
        emit AutorizeUserToVoteInProposal(_user, _proposal);
    }

    function autorizeUserToVoteInProposal(
        uint256 _proposal,
        address[] memory _users
    ) public onlyOwner {
        require(_proposal <= (proposals.length - 1), "This proposal not exist");
        for (uint256 i = 0; i < _users.length; i++) {
            proposalAutorizations[_users[i]][_proposal] = true;
            emit AutorizeUserToVoteInProposal(_users[i], _proposal);
        }
    }

    function vote(uint256 _proposal, VoteOption _vote)
        public
        onlyAutorizedToVote(_proposal)
        onlyOneVoteByProposal(_proposal)
    {
        // prevent multiple votes by re-entrancy attack
        proposalUserVotes[msg.sender][_proposal] = _vote;

        // increase counter
        if (_vote == VoteOption.YES) {
            proposals[_proposal].upVotes += 1;
        } else if (_vote == VoteOption.NO) {
            proposals[_proposal].downVotes += 1;
        }

        emit Vote(msg.sender, _proposal, _vote);
    }
}
