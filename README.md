# Инструкция по развертыванию
1. Развернуть ноду Chainlink, используя файлы config.toml и secrets.toml в папке chainlink (при необходимости изменить ключи доступа к API Sepolia и информацию подключения к БД)
2. Добавить в ноду Chainlink задание из файла metalsjob.toml
3. Загрузить backend
4. В папке backend выполнить npm install (убедиться, что установлен Node.js)
5. В папке backend выполнить npx ts-node index.ts
6. Развернуть смарт-контракт Operator, в качестве параметра link указать адрес токена LINK в сети Sepolia, в качестве параметра owner указать свой адрес
7. В интерфейсе Chainlink узнать адрес узла
8. Выполнить в смарт-контракте Operator функцию setAuthorizedSenders, в качестве параметра senders указать массив, состоящий из строки-адреса узла Chainlink
9. Развернуть смарт-контракт MyContract, в качестве параметра oracle указать адрес контракта Operator, в качестве jobId указать id задачи, созданной в ноде Chainlink, без дефисов
10. Развернуть смарт-контракты RubleToken, GoldToken, SilverToken, PlatinumToken, PalladiumToken
11. В каждом из контрактов RubleToken, GoldToken, SilverToken, PlatinumToken, PalladiumToken выполнить функцию transferOwnership, указав в качестве to адрес MyContract
12. В контракте MyContract выполнять функцию setToken для каждого из значений параметра name: "ruble", "gold", "silver", "platinum", "palladium", указывая в качестве addr адрес соответствующего контракта токена
13. Пополнить адрес ноды Chainlink монетами Ether, пополнить адрес контракта Operator токенами LINK
14. Загрузить frontend
15. В папке frontend выполнить npm install
16. В папке frontend выполнить npm run dev
17. Открыть в браузере 127.0.0.1:3000
18. Подключить MetaMask и работать с веб-страницей
