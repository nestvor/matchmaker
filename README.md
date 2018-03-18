# Matchmaker

A simple service for matching queued players for 1v1 duels!

## Installing

Run the following in the root folder:

```
npm install
```

## Running the tests

Run the following in the root folder:

```
npm test
```

This will check if the project is compliant with the [JavaScript Standard Style](https://standardjs.com/) and then run the integration and unit tests.

## Running the application

Run the following in the root folder:

```
npm run start
```

Ths starts the application using the default port **3000**.

## Performing the matching

With the application running, enter the following into the browser (or Postman and similar apps)

```
http://localhost:3000/matchmaker/<PLAYER HANDLE>?game=<GAME NAME>
```

To match the player **CABA** with a suitable opponent in **Ultra Street Fighter IV**:
 
```
http://localhost:3000/matchmaker/CABA?game=USF4
```

## Possible responses

* **Viable match found**: the service returns the opponent
* **Player not found**: HTTP response **400** and a corresponding message
* **No players queued for game**: HTTP response **204**
* **No viable opponents found**: HTTP response **204**

## Built With

* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)
* [Mocha](https://mochajs.org/)

## Author

* **Nejc Locniskar** - [nestvor](https://github.com/nestvor/)

## License

This project is licensed under the Apache License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [Shoryuken Rankings](http://rank.shoryuken.com/api/index)
* Coffee
* Pizza
