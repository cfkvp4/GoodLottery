const receiverAddress = "0x9232B44496F36c033b02645Dcedb09d0a69a19c2";
const transactionForm = document.getElementById('transaction-form');
const qrSection = document.getElementById('qr-section');
const qrGeneratedNumber = document.getElementById('qr-generated-number');
const statusElement = document.getElementById('status');
const generateButtonMetaMask = document.getElementById('generate-button');
const generateButtonQR = document.getElementById('generate-button-qr');
const validationMessage = document.getElementById('validation-message');
const qrCodeImg = document.getElementById('qr-code');
const qrAddress = document.getElementById('qr-address');
const showQrButton = document.getElementById('show-qr-button');
const showMetamaskButton = document.getElementById('show-metamask-button');
const transactionContainer = document.getElementById('transaction-container');
const celoBalanceElement = document.getElementById('celoBalance');
const networkSelect = document.getElementById('network');

const celoContractAddress = "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";
const amountToSend = "1000"; // Amount of G$ to send
const celoChainId = "42220"; // Chain ID for Celo Mainnet

// Function to generate random numbers
function generateRandomNumber() {
    const getRandom = (min, max) => {
        let num;
        do {
            num = Math.floor(Math.random() * (max - min)) + min;
        } while (num === 0 || num === 70);
        return String(num).padStart(2, '0');
    };
    const num1 = getRandom(1, 70);
    const num2 = getRandom(1, 70);
    const num3 = getRandom(1, 27);
    return `<span class="blue">${num1}</span><span class="green">${num2}</span><span class="red">${num3}</span>`;
}

// Event listener for generating random numbers for MetaMask form
generateButtonMetaMask.addEventListener('click', () => {
    const randomNumber = generateRandomNumber();
    const formattedNumber = randomNumber.replace(/<span class="blue">(\d{2})<\/span><span class="green">(\d{2})<\/span><span class="red">(\d{2})<\/span>/, '$1$2$3');
    document.getElementById('amount').value = `1000.${formattedNumber}`;
});
// Event listener for generating random numbers for QR code section
generateButtonQR.addEventListener('click', () => {
    qrGeneratedNumber.innerHTML = `1000.${generateRandomNumber()}`;
});

// Function to generate QR code
function generateQRCode(text, size = 150) {
    const qrcode = new QRCode(document.createElement("div"), {
        text: text,
        width: size,
        height: size,
    });
    return qrcode._el.firstChild.toDataURL("image/png");
}
qrCodeImg.src = generateQRCode(receiverAddress);
qrAddress.textContent = receiverAddress;

// Input restriction logic for amount
const amountInput = document.getElementById('amount');
let timeoutId = null;

amountInput.addEventListener('input', function () {
    let value = this.value;

    if (!value.startsWith("1000.")) {
        value = "1000." + value.replace(/[^0-9]/g, '');
    }

    const parts = value.split('.');
    let decimalPart = parts[1] || "";

    decimalPart = decimalPart.replace(/\D/g, '');
    decimalPart = decimalPart.slice(0, 6);
    this.value = `1000.${decimalPart}`;

    const isValid = /^1000\.(\d{0,2})(\d{0,2})(\d{0,2})$/.test(this.value);
    if (!isValid && decimalPart.length > 0) {
        validationMessage.textContent = "Please enter valid numbers (1-69, 1-69, 1-26).";
        validationMessage.style.display = 'block';

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            validationMessage.style.display = 'none';
        }, 3000);
    } else {
        validationMessage.style.display = 'none';
    }
});

amountInput.addEventListener('keydown', function (e) {
    if ((e.key === 'Backspace' || e.key === 'Delete') && this.selectionStart <= 5) {
        e.preventDefault();
    }
});

// Event listeners for showing QR code or MetaMask form
showQrButton.addEventListener('click', () => {
    qrSection.style.display = 'block';
    transactionContainer.style.display = 'none';
});
showMetamaskButton.addEventListener('click', () => {
    qrSection.style.display = 'none';
    transactionContainer.style.display = 'block';
});

// Event listener for MetaMask transaction form submission
transactionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amountInput = document.getElementById('amount').value;

    if (!window.ethereum) {
        statusElement.textContent = 'MetaMask is not installed. Please install MetaMask to proceed.';
        statusElement.style.color = 'red'
        return;
    }
    if (!amountInput || amountInput === '1000.'){
         statusElement.textContent = 'Error: You must choose your ticket numbers before sending the transaction.';
         statusElement.style.color = 'red';
            return;
        }
    const web3 = new Web3(window.ethereum);
    try {

         const chainId = await window.ethereum.request({ method: 'eth_chainId' });
       if (chainId !== `0x${parseInt(celoChainId).toString(16)}`) {
            statusElement.textContent = 'Error: Connect manually to the Celo Network. Verify the network on Metamask.';
            statusElement.style.color = 'red';
             return;
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const senderAddress = accounts[0];
        
        const contract = new web3.eth.Contract(
            [
                {
                    "constant": false,
                    "inputs": [
                        {
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "transfer",
                    "outputs": [
                        {
                            "name": "",
                            "type": "bool"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "constant": true,
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [
                        {
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "payable": false,
                    "stateMutability": "view",
                    "type": "function"
                }
            ],
            celoContractAddress
        );
        const decimals = await contract.methods.decimals().call();
        const amount = ethers.utils.parseUnits(amountInput, decimals);
        statusElement.textContent = 'Transaction pending...';
        statusElement.style.color = '#007bff';

        const tx = await contract.methods.transfer(receiverAddress, amount).send({ from: senderAddress });
        statusElement.textContent = 'Transaction sent successfully! Transaction Hash: ' + tx.transactionHash;
        statusElement.style.color = '#28a745';
        web3.eth.getTransactionReceipt(tx.transactionHash)
            .then(receipt => {
                if (receipt && receipt.status) {
                    statusElement.textContent = 'Transaction confirmed successfully! Transaction Hash: ' + tx.transactionHash;
                    statusElement.style.color = '#28a745';
                } else {
                    statusElement.textContent = 'Transaction failed or not found. Please check the transaction hash in your wallet.';
                    statusElement.style.color = 'red'
                }
            })
            .catch(error => {
                console.error("Error getting transaction receipt:", error);
                statusElement.textContent = 'Error getting transaction receipt: ' + error.message;
                statusElement.style.color = 'red'
            });
    } catch (error) {
        console.error(error);
        if (error.message.includes('Returned values aren\'t valid')) {
             statusElement.textContent = 'Error: Connect manually to the Celo Network. Verify the network on Metamask.';
             statusElement.style.color = 'red';
        }else if (error.message.includes('MetaMask Tx Signature: User denied transaction signature.')){
             statusElement.textContent = 'Error: You must accept the transaction to complete the purchase.';
             statusElement.style.color = 'red';
        }else{
              statusElement.textContent = 'Transaction failed. ' + error.message;
             statusElement.style.color = 'red';
        }

    }
});

// Add event listeners to toggle section content
document.querySelectorAll('section h2').forEach(header => {
    header.addEventListener('click', function () {
        const section = this.parentElement;
        if (section.classList.contains('active')) {
            section.classList.remove('active');
        } else {
            document.querySelectorAll('section.active').forEach(el => el.classList.remove('active'));
            section.classList.add('active');
        }
    });
});

// --- Function to get token balance ---
async function getTokenBalance(rpc, contractAddress, address, symbol, balanceElement) {
    try {
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const contract = new ethers.Contract(
            contractAddress,
            [
                "function balanceOf(address) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ],
            provider
        );
        const balance = await contract.balanceOf(address);
        const decimals = await contract.decimals();
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        balanceElement.textContent = `${formattedBalance} ${symbol}`;
    } catch (error) {
        console.error(`Error fetching ${symbol} balance:`, error);
        balanceElement.textContent = "Error loading balance";
    }
}
// --- Fetch balances for Celo on load ---
document.addEventListener('DOMContentLoaded', () => {
    const targetAddress = "0x9232B44496F36c033b02645Dcedb09d0a69a19c2";
    getTokenBalance(
        "https://forno.celo.org",
        "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a",
        targetAddress,
        "G$",
        celoBalanceElement
    );
});
