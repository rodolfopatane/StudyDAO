// add
const infuraAPIKey = '';
const contractAdress = '0xFd545F40f6f924437EBb2eD95293d8AC18C8e51a';
const provider = `wss://rinkeby.infura.io/ws/v3/${infuraAPIKey}`;

// buttons
const connectWalletButton = document.getElementById('connectWalletButton');
const disconnectWalletButton = document.getElementById('disconnectWalletButton');
const includeProposalButton = document.getElementById('includeProposalButton');
const autorizeProposeButton = document.getElementById('autorizeProposeButton');

// display results/errors
const selectedAccountDisplay = document.getElementById('selectedAccountDisplay');
const sendProposalResultDisplay = document.getElementById('sendProposalResultDisplay');
const autorizeProposeDisplay = document.getElementById('listProposalsDiv');
const listProposalsDiv = document.getElementById('autorizeProposeDisplay');

// form field
const proposalDescription = document.getElementById('proposalDescription');
const autorizeUserInput = document.getElementById('autorizeUserInput');

// global info
let selectedAccount;
let web3;
let contract;

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

    if (await connect()) {
        return true;
    }

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

// load initial state
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
    }, 200);

}

/// contract interact functions
const includeProposal = async () => {
    if (await checkConnectedWallet()) {
        const _proposalDescription = proposalDescription.value;
        try {
            const transactionData = await contract.methods.includeProposal(_proposalDescription).encodeABI();

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
            sendProposalResultDisplay.innerHTML = `${txHash}`;
        } catch (error) {
            sendProposalResultDisplay.innerHTML = error.message;
        }
    }

}

const autorizePropose = async () => {
    if (await checkConnectedWallet()) {
        const _autorizeUserInput = autorizeUserInput.value;
        try {
            const transactionData = await contract.methods.autorizePropose(_autorizeUserInput).encodeABI();

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
            autorizeProposeDisplay.innerHTML = `${txHash}`;
        } catch (error) {
            autorizeProposeDisplay.innerHTML = error.message;
        }
    }
}

const getProposalVotes = async () => {
    if (await checkConnectedWallet()) {
        try {
            const proposalVotes = await contract.methods.getProposalVotes().call();
            proposalVotes.forEach(proposal => {
                const p = document.createElement(`p`);
                p.innerHTML = `<p class="mb-0">${proposal}</p>`;
                listProposalsDiv.appendChild(p);
            });



            console.log(proposalVotes);
        } catch (error) {
            console.log(error);
        }
    }
}