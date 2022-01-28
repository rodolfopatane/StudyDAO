// MESSAGES
const NOT_CONECTED = 'Connect your wallet first';
// add
const infuraAPIKey = '';
const contractAdress = '0x0E2aABA6E3210EA3F07dC75446778CAE55DA3Eed';
const provider = `wss://rinkeby.infura.io/ws/v3/${infuraAPIKey}`;

// buttons
const connectWalletButton = document.getElementById('connectWalletButton');
const disconnectWalletButton = document.getElementById('disconnectWalletButton');
const includeProposalButton = document.getElementById('includeProposalButton');
const autorizeProposeButton = document.getElementById('autorizeProposeButton');
const autorizeUserToVoteInProposalButton = document.getElementById('autorizeUserToVoteInProposalButton');

// display results/errors
const selectedAccountDisplay = document.getElementById('selectedAccountDisplay');
const sendProposalResultDisplay = document.getElementById('sendProposalResultDisplay');
const listProposalsDiv = document.getElementById('listProposalsDiv');
const autorizeProposeDisplay = document.getElementById('autorizeProposeDisplay');
const voteDisplay = document.getElementById('voteDisplay');


// form field
const proposalDescription = document.getElementById('proposalDescription');
const autorizeUserInput = document.getElementById('autorizeUserInput');
const autorizeUserToVoteInProposalInput = document.getElementById('autorizeUserToVoteInProposalInput');
const autorizeUserToVoteInProposalSelect = document.getElementById('autorizeUserToVoteInProposalSelect');
// global info
let selectedAccount;
let web3;
let contract;
let proposalVotes;

// connect wallete functions

const connect = async () => {
    try {
        await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{
                eth_accounts: {}
            }]
        });
        selectedAccount = await ethereum.request({ method: 'eth_accounts' });
        selectedAccountDisplay.innerHTML = selectedAccount[0];
        window.localStorage.setItem('wallet', selectedAccount[0]);
        connectWalletButton.hidden = true;
        disconnectWalletButton.hidden = false;
        return true;
    } catch (error) {
        selectedAccountDisplay.innerHTML = error.message;
        return false;
    }
}

const disconnect = async () => {
    window.localStorage.setItem('wallet', null);
    selectedAccountDisplay.innerHTML = '';
    connectWalletButton.hidden = false;
    disconnectWalletButton.hidden = true

}

const checkConnectedWallet = async () => {
    if (selectedAccount) {
        return true;
    }
    alert(NOT_CONECTED);
    return false
}

// event buttons
connectWalletButton.addEventListener("click", () => {
    connect();
});

disconnectWalletButton.addEventListener("click", () => {
    disconnect();
});

includeProposalButton.addEventListener("click", () => {
    includeProposal();
});

autorizeProposeButton.addEventListener("click", () => {
    autorizePropose();
});
autorizeUserToVoteInProposalButton.addEventListener("click", () => {
    autorizeUserToVoteInProposal();
});

// load initial state and wallet status subscribe
window.onload = () => {
    const time = setTimeout(async () => {
        clearTimeout(time);
        if (window.localStorage.getItem('wallet') === null || window.localStorage.getItem('wallet') == 'null') {
            connectWalletButton.hidden = false;
            disconnectWalletButton.hidden = true

        } else {
            connectWalletButton.hidden = true;
            disconnectWalletButton.hidden = false;
            selectedAccount = window.localStorage.getItem('wallet');
            selectedAccountDisplay.innerHTML = selectedAccount;
        }
        web3 = new Web3(provider);
        const file = await fetch('./ProposalsVoting.json');
        const abiInterface = (await file.json()).abi;
        contract = new web3.eth.Contract(abiInterface, contractAdress);
        getProposalVotes();
        startListeningWalletChanges();
    }, 200);

}

const startListeningWalletChanges = async () => {
    window.ethereum.on('accountsChanged', (wallets) => {
        if (window.ethereum.selectedAddress !== selectedAccount) {
            selectedAccount = window.ethereum.selectedAddress;
            window.localStorage.setItem('wallet', selectedAccount)
            selectedAccountDisplay.innerHTML = selectedAccount;
            return;
        }
        if (wallets.length === 0) {
            disconnect();
        }
    })
}

// generate TX object
const generateAndSendTxObject = async (method, ...data) => {
    if (await checkConnectedWallet()) {
        try {
            const transactionData = await contract.methods[method](...data).encodeABI();
            txCount = await web3.eth.getTransactionCount(selectedAccount);
            const txObject = {
                to: contractAdress,
                from: selectedAccount,
                nonce: web3.utils.toHex(txCount),
                gasLimit: web3.utils.toHex(2100000),
                gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
                data: transactionData
            }
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txObject]
            });
            return txHash;
        } catch (error) {
            return error.message;
        }
    } else {
        return NOT_CONECTED;
    }
};

/// contract interact functions
const getProposalVotes = async () => {
    try {
        proposalVotes = await contract.methods.getProposalVotes().call();
        proposalVotes.forEach((proposal, index) => {
            const p = document.createElement(`p`);
            p.innerHTML = `<p class="mb-0">Voltes: ${proposal[1]} -  Proposal: ${proposal[0]}</p><button class="btn btn-outline-success me-2" onclick="vote(${index})">Vote</button>`;
            listProposalsDiv.appendChild(p);

            const option = document.createElement(`option`);
            option.innerHTML = `<option value="${index}">${proposal[0]}</option>`;
            autorizeUserToVoteInProposalSelect.appendChild(option);

        });
        console.log(proposalVotes);
    } catch (error) {
        console.log(error);
    }
}

const includeProposal = async () => {
    sendProposalResultDisplay.innerHTML = await generateAndSendTxObject('includeProposal', proposalDescription.value);
}

const autorizePropose = async () => {
    autorizeProposeDisplay.innerHTML = await generateAndSendTxObject('autorizePropose', autorizeUserInput.value);
}

const autorizeUserToVoteInProposal = async () => {
    const _selectedProposal = autorizeUserToVoteInProposalSelect.selectedIndex - 1;
    if (_selectedProposal < 0) {
        alert('Select an proposal')
        return;
    }
    autorizeUserToVoteInProposalDisplay.innerHTML = await generateAndSendTxObject('autorizeUserToVoteInProposal', _selectedProposal, selectedAccount);
}

const vote = async (_proposal) => {
    voteDisplay.innerHTML = await generateAndSendTxObject('vote', _proposal);
}