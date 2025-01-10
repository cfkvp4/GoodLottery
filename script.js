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

// Function to generate random numbers according to the rules
function generateRandomNumber() {
    // Function to generate a random number between min (inclusive) and max (exclusive)
    const getRandom = (min, max) => {
        let num;
        do{
            num = Math.floor(Math.random() * (max - min)) + min;
        }while (num === 0 || num === 70);
        return String(num).padStart(2, '0');
    };
    // Generate two random numbers between 1 and 69
    const num1 = getRandom(1, 70);
    const num2 = getRandom(1, 70);
    // Generate one random number between 1 and 26
    const num3 = getRandom(1, 27);
    // Combine the numbers and return the result
    return `<span class="blue">${num1}</span><span class="green">${num2}</span><span class="red">${num3}</span>`;
}

generateButtonMetaMask.addEventListener('click', () => {
    const randomNumber = generateRandomNumber();
     const formattedNumber = randomNumber.replace(/<span class="blue">(\d{2})<\/span><span class="green">(\d{2})<\/span><span class="red">(\d{2})<\/span>/, '$1$2$3');
    document.getElementById('amount').value = `1000.${formattedNumber}`;
});

generateButtonQR.addEventListener('click', () => {
        qrGeneratedNumber.innerHTML = `1000.${generateRandomNumber()}`;
});


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
// Restrict input in MetaMask Form to only allowed numbers
 const amountInput = document.getElementById('amount');
let timeoutId = null;

amountInput.addEventListener('input', function () {
    let value = this.value;

   // Asegurar que el valor siempre comience con "1000."
    if (!value.startsWith("1000.")) {
        value = "1000." + value.replace(/[^0-9]/g, '');
     }

    const parts = value.split('.');
    let decimalPart = parts[1] || "";

    // Remover caracteres no numéricos
    decimalPart = decimalPart.replace(/\D/g, '');

    // Limitar a 6 dígitos en total
     decimalPart = decimalPart.slice(0, 6);

     // Reconstruir el valor
     this.value = `1000.${decimalPart}`;

    // Validar y mostrar mensajes de error si es necesario
     const isValid = /^1000\.(\d{0,2})(\d{0,2})(\d{0,2})$/.test(this.value);
     if (!isValid && decimalPart.length > 0) {
        validationMessage.textContent = "Por favor, ingresa números válidos (1-69, 1-69, 1-26).";
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
    // Evitar borrar el prefijo "1000."
    if ((e.key === 'Backspace' || e.key === 'Delete') && this.selectionStart <= 5) {
        e.preventDefault();
    }
});
  showQrButton.addEventListener('click', () => {
      qrSection.style.display = 'block';
     transactionContainer.style.display = 'none';
   });
showMetamaskButton.addEventListener('click', () => {
      qrSection.style.display = 'none';
     transactionContainer.style.display = 'block';
});
transactionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = document.getElementById('amount').value;

     if (!window.ethereum) {
        statusElement.textContent = 'MetaMask is not installed. Please install MetaMask to proceed.';
        statusElement.style.color = 'red'
        return;
    }

    const web3 = new Web3(window.ethereum);

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const senderAddress = accounts[0];
        const valueInWei = web3.utils.toWei(amount, 'ether');


        const transactionParameters = {
            to: receiverAddress,
            from: senderAddress,
            value: web3.utils.toHex(valueInWei),
        };
        statusElement.textContent = 'Transaction pending...';
        statusElement.style.color = '#007bff';

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });


        statusElement.textContent = 'Transaction sent successfully! Transaction Hash: ' + txHash;
          statusElement.style.color = '#28a745';
           // Use a web3 method to get the transaction receipt to ensure the transaction has been included in a block
              web3.eth.getTransactionReceipt(txHash)
           .then(receipt => {
              if (receipt && receipt.status) {
            statusElement.textContent = 'Transaction confirmed successfully! Transaction Hash: ' + txHash;
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
        statusElement.textContent = 'Transaction failed. ' + error.message;
          statusElement.style.color = 'red'
    }
});
 // Add event listeners to toggle section content
 document.querySelectorAll('.section h2').forEach(header => {
    header.addEventListener('click', function() {
      const section = this.parentElement;
         // If the section is active, remove the 'active' class and hide the content
        if (section.classList.contains('active')) {
             section.classList.remove('active');
           } else {
            // If the section is not active, first remove 'active' from any other open section, then add it to the clicked one.
             document.querySelectorAll('.section.active').forEach(el => el.classList.remove('active'));
               section.classList.add('active');
        }
  });
 });
