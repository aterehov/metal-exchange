import Head from "next/head";
import React from "react";
import { loadData } from "../web3/funcs";

export default function Home() {
  const [contract, setContract] = React.useState(null);
  const [addressAccount, setAddressAccount] = React.useState(null);
  const [contractAddress, setContractAddress] = React.useState(null);

  const [rubleContract, setRubleContract] = React.useState(null);
  const [goldContract, setGoldContract] = React.useState(null);
  const [silverContract, setSilverContract] = React.useState(null);
  const [platinumContract, setPlatinumContract] = React.useState(null);
  const [palladiumContract, setPalladiumContract] = React.useState(null);

  const [connected, setConnected] = React.useState(false);

  const [rubleBalance, setRubleBalance] = React.useState(null);
  const [goldBalance, setGoldBalance] = React.useState(null);
  const [silverBalance, setSilverBalance] = React.useState(null);
  const [platinumBalance, setPlatinumBalance] = React.useState(null);
  const [palladiumBalance, setPalladiumBalance] = React.useState(null);
  const [prices, setPrices] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  const [dataFetched, setDataFetched] = React.useState(false);

  const handleWeb3 = async () => {
    const data = await loadData();

    setContract(data.MyContract);
    setAddressAccount(data.addressAccount);
    setContractAddress(data.Contract_Address);

    setRubleContract(data.rubleContract);
    setGoldContract(data.goldContract);
    setSilverContract(data.silverContract);
    setPlatinumContract(data.platinumContract);
    setPalladiumContract(data.palladiumContract);

    setConnected(true);
  };

  React.useEffect(() => {
    if (!connected) {
      return;
    }
    const f = async () => {
      let rb = await rubleContract.methods.balanceOf(addressAccount).call();
      let gb = await goldContract.methods.balanceOf(addressAccount).call();
      let sb = await silverContract.methods.balanceOf(addressAccount).call();
      let plb = await platinumContract.methods.balanceOf(addressAccount).call();
      let pdb = await palladiumContract.methods
        .balanceOf(addressAccount)
        .call();

      let p = await contract.methods.prices().call();
      let lu = await contract.methods.lastUpdated().call();

      setRubleBalance(rb);
      setGoldBalance(gb);
      setSilverBalance(sb);
      setPlatinumBalance(plb);
      setPalladiumBalance(pdb);
      setPrices(p);
      setLastUpdated(lu);
      setDataFetched(true);
    };
    f();
  }, [connected]);

  async function transact(func) {
    const data = await func.encodeABI();

    const nonce = await web3.eth.getTransactionCount(addressAccount);

    const estimateGas = await func.estimateGas({
      from: addressAccount,
      to: func._parent._address,
      nonce: nonce,
      data: data,
    });

    const params = {
      from: addressAccount,
      to: func._parent._address,
      gas: web3.utils.toHex(estimateGas),
      data: data,
    };

    ethereum
      .request({
        method: "eth_sendTransaction",
        params: [params],
      })
      .then((res) => {
        console.log("Transaction Hash: ", res);

        const interval = setInterval(() => {
          web3.eth.getTransactionReceipt(res, (err, rec) => {
            if (rec) {
              handleWeb3();
              setInputValue("");
              clearInterval(interval);
            }

            if (err) {
              console.log("ERROR: ", err);
            }
          });
        }, 500);
      });
  }

  const [goldAmount, setGoldAmount] = React.useState(0);
  const [silverAmount, setSilverAmount] = React.useState(0);
  const [platinumAmount, setPlatinumAmount] = React.useState(0);
  const [palladiumAmount, setPalladiumAmount] = React.useState(0);

  function checkprice(metal, type) {
    let lu = Number(lastUpdated[metal + type]);
    let dlu = new Date(lu * 1000);
    return new Date() - dlu < 1000 * 60 * 60 * 24;
  }

  async function makeaction(metal, type) {
    if (!checkprice(metal, type)) {
      alert(
        "Сначала необходимо обновить соответствующую цену. Нажмите кнопку обновления под нужной ценой, подождите несколько минут, затем перезагрузите страницу. "
      );
      return;
    }

    let amount;
    let tokencontract;
    if (type == "sell") {
      tokencontract = rubleContract;
    } else if (metal == "gold") {
      tokencontract = goldContract;
    } else if (metal == "silver") {
      tokencontract = silverContract;
    } else if (metal == "platinum") {
      tokencontract = platinumContract;
    } else if (metal == "palladium") {
      tokencontract = palladiumContract;
    }

    if (metal == "gold") {
      amount = goldAmount;
    } else if (metal == "silver") {
      amount = silverAmount;
    } else if (metal == "platinum") {
      amount = platinumAmount;
    } else if (metal == "palladium") {
      amount = palladiumAmount;
    }

    if (!(await checkallowance(tokencontract, amount + "000000000000000000"))) {
      alert(
        "Необходимо разрешить трату токенов. Нажмите кнопку 'Разрешить трату' для токена, который будете отдавать. "
      );
      return;
    }

    if (type == "buy") {
      transact(contract.methods.buyMetal(metal, amount + "000000000000000000"));
    } else {
      transact(
        contract.methods.sellMetal(metal, amount + "000000000000000000")
      );
    }
  }

  function requestprice(metal, type) {
    transact(contract.methods.requestPrice(metal, type));
  }

  async function checkallowance(tokencontract, required) {
    return (
      (await tokencontract.methods
        .allowance(addressAccount, contractAddress)
        .call()) >= required
    );
  }

  function getapproval(tokencontract, required) {
    transact(tokencontract.methods.approve(contractAddress, required));
  }

  return (
    <>
      <Head>
        <title>Обмен драгоценных металлов</title>
        <meta name="description" content="Exchange precious metals" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1>Обмен драгоценных металлов</h1>

      <button onClick={handleWeb3}>Подключиться к MetaMask</button>

      {connected ? (
        <div>
          <h3>
            Баланс: {dataFetched ? rubleBalance / 1000000000000000000 : "NULL"}{" "}
            RUB
          </h3>
          <button onClick={() => transact(contract.methods.getBonusRubles())}>
            Получить бонус
          </button>
          {/* <button onClick={() => alert(goldAmount)}>goldAmount</button> */}
          <button
            onClick={() =>
              getapproval(rubleContract, "1000000000000000000000000000")
            }
          >
            Разрешить трату RUB
          </button>

          {dataFetched ? (
            <table>
              <thead>
                <tr>
                  <td>Металл</td>
                  <td>Цена покупки</td>
                  <td>Цена продажи</td>
                  <td>Действия</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Золото</td>
                  <td>
                    {prices.goldbuy / 100}
                    <br />
                    <button onClick={() => requestprice("gold", "BUY")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    {prices.goldsell / 100}
                    <br />
                    <button onClick={() => requestprice("gold", "SELL")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    <p>Баланс: {goldBalance / 1000000000000000000} GLD</p>
                    <input
                      id="goldamount"
                      type="number"
                      min={0}
                      onChange={(e) => setGoldAmount(e.target.value)}
                    />
                    <br />
                    <button onClick={() => makeaction("gold", "buy")}>
                      Купить
                    </button>
                    <button onClick={() => makeaction("gold", "sell")}>
                      Продать
                    </button>
                    <button
                      onClick={() =>
                        getapproval(
                          goldContract,
                          "1000000000000000000000000000"
                        )
                      }
                    >
                      Разрешить трату GLD
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Серебро</td>
                  <td>
                    {prices.silverbuy / 100}
                    <br />
                    <button onClick={() => requestprice("silver", "BUY")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    {prices.silversell / 100}
                    <br />
                    <button onClick={() => requestprice("silver", "SELL")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    <p>Баланс: {silverBalance / 1000000000000000000} SLV</p>
                    <input
                      id="silveramount"
                      type="number"
                      min={0}
                      onChange={(e) => setSilverAmount(e.target.value)}
                    />
                    <br />
                    <button onClick={() => makeaction("silver", "buy")}>
                      Купить
                    </button>
                    <button onClick={() => makeaction("silver", "sell")}>
                      Продать
                    </button>
                    <button
                      onClick={() =>
                        getapproval(
                          silverContract,
                          "1000000000000000000000000000"
                        )
                      }
                    >
                      Разрешить трату SLV
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Платина</td>
                  <td>
                    {prices.platinumbuy / 100}
                    <br />
                    <button onClick={() => requestprice("platinum", "BUY")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    {prices.platinumsell / 100}
                    <br />
                    <button onClick={() => requestprice("platinum", "SELL")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    <p>Баланс: {platinumBalance / 1000000000000000000} PLT</p>
                    <input
                      id="platinumamount"
                      type="number"
                      min={0}
                      onChange={(e) => setPlatinumAmount(e.target.value)}
                    />
                    <br />
                    <button onClick={() => makeaction("platinum", "buy")}>
                      Купить
                    </button>
                    <button onClick={() => makeaction("platinum", "sell")}>
                      Продать
                    </button>
                    <button
                      onClick={() =>
                        getapproval(
                          platinumContract,
                          "1000000000000000000000000000"
                        )
                      }
                    >
                      Разрешить трату PLT
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Палладий</td>
                  <td>
                    {prices.palladiumbuy / 100}
                    <br />
                    <button onClick={() => requestprice("palladium", "BUY")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    {prices.palladiumsell / 100}
                    <br />
                    <button onClick={() => requestprice("palladium", "SELL")}>
                      Обновить
                    </button>
                  </td>
                  <td>
                    <p>Баланс: {palladiumBalance / 1000000000000000000} PLD</p>
                    <input
                      id="palladiumamount"
                      type="number"
                      min={0}
                      onChange={(e) => setPalladiumAmount(e.target.value)}
                    />
                    <br />
                    <button onClick={() => makeaction("palladium", "buy")}>
                      Купить
                    </button>
                    <button onClick={() => makeaction("palladium", "sell")}>
                      Продать
                    </button>
                    <button
                      onClick={() =>
                        getapproval(
                          palladiumContract,
                          "1000000000000000000000000000"
                        )
                      }
                    >
                      Разрешить трату PLD
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : null}

          {/* <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            placeholder="Put a number"
          /> */}
        </div>
      ) : null}
    </>
  );
}
