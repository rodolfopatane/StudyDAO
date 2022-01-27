const Migrations = artifacts.require("Migrations");
const ProposalsVoting = artifacts.require("ProposalsVoting");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(ProposalsVoting);
};
