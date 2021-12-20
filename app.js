let secureRandom = require('secure-random');
let CryptoJS = require('crypto-js');
let hex = require('crypto-js/enc-hex');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
const { table } = require('table');
const hasDuplicates = require('has-duplicates');
const random = require('random');

class Main {
    constructor(process){
        this.possibleTurns = process.argv.slice(2);
    }

    startNewGame () {
        this.checkPossibleTurns();
        this.generateTurn();
        const hashAndKey = new HashAndKeyGenerator(this.computerTurn);
        this.key = hashAndKey.generateKey();
        this.hash = hashAndKey.generateHash();
        console.log('\nHMAC: ' + hashAndKey.hashedTurn);
        const rulesObject = new Rules(this.possibleTurns);
        rulesObject.generateRules();
        const tableObject = new Table(rulesObject.rules, this.possibleTurns);   
        tableObject.generateTable();
        this.generateMenu();
        this.fetchUserTurn(tableObject);
    }

    generateTurn () {
        this.computerTurnIndex = random.int((0), (this.possibleTurns.length - 1));
        this.computerTurn = this.possibleTurns[this.computerTurnIndex]; 
    }

    generateMenu(){
        this.possibleInputs = [];
        this.menu = [];
        let counter = 0;
        this.possibleTurns.forEach((turn)=>{
            counter += 1;
            this.possibleInputs.push(counter);
            const string = '\n' + counter + ' - ' + turn;
            this.menu.push(string);
        })
        this.menu.push('\n0 - exit \n? - help');
    }

    fetchUserTurn (tableObject) {
        readline.question(`Available turns:${this.menu.join('')}\nEnter your turn: `, (input) => {
            this.userTurn = this.possibleTurns[input - 1];
            if (this.userTurn === undefined && !this.possibleInputs.includes(Number(input)) && input !== '?' && input !== '0') {
                console.log('Invalid input.');
                this.fetchUserTurn(tableObject);
                return null
            } else {
                if (input === '?') { 
                    tableObject.showTable();
                    this.fetchUserTurn(tableObject);
                    return null
                } else if (input === '0') {
                    process.exit()
                } else {
                    console.log('Your turn is: ' + this.userTurn);
                    this.userTurnIndex = this.possibleTurns.indexOf(this.userTurn);
                    const result = tableObject.table[this.userTurnIndex + 1][this.computerTurnIndex + 1];
                    console.log(result === 'draw' ? 
                    result + '\n' + 'Computer turn was: ' + this.computerTurn + '\n' + 'secret key: ' + this.key : 
                    'You ' + result + '\n' + 'Computer turn was: ' + this.computerTurn + '\n' + 'secret key: ' + this.key);
                    this.startNewGame();
                }
            }
        });
    }

    checkPossibleTurns(){
        let errorMessage = '';
        if (this.possibleTurns.length < 3) {
            errorMessage = 'The number of your input arguments is less than 3, it must be at least 3 e.g. "1 2 3"';
        } else if (!(this.possibleTurns.length % 2)){
            errorMessage = 'The number of your input arguments is even, it must be odd e.g. "rock scissors paper lizard spock"';
        } else if (hasDuplicates(this.possibleTurns)) {
            errorMessage = 'Your input contains duplicates, there must not be duplicates in your input e.g. "12 15 17"';
        }
        if (errorMessage) {
            console.log(errorMessage);
            process.exit()
        } 
    }
}

class HashAndKeyGenerator {
    constructor (turn) {
        this.turn = turn;
    }

    generateKey () {
        this.key = secureRandom.randomArray(32).join('');
        return this.key
    }

    generateHash () {
        this.hashedTurn = hex.stringify(CryptoJS.HmacSHA256(this.turn, this.key));
        return this.hashedTurn
    }
}

class Rules {
    constructor (turns) {
        this.turns = turns;
        this.rules = [];
    }

    generateRules(){
        let centerIndex = Math.floor(this.turns.length / 2);
        let counter = 0;
        this.turns.map((turn, turnIndex, array) => {
            let turnsArray = array.slice();
            let losers = [];
            let winners = [];
            if (turnIndex < centerIndex){
                turnsArray.splice(turnIndex, 1);
                losers = turnsArray.splice(turnIndex, centerIndex);
                winners = turnsArray.slice();
            } else  if (turnIndex > centerIndex) {
                turnsArray.splice(turnIndex, 1);
                winners = turnsArray.splice(turnIndex - centerIndex, centerIndex);
                losers = turnsArray.slice();
            } else {
                turnsArray.splice(turnIndex, 1);
                winners = turnsArray.splice(0, centerIndex);
                losers = turnsArray.slice();
            }
            turnsArray = [[...winners], turn, [...losers]];
            this.rules.push(turnsArray);  
        })
    }
}

class Table {
    constructor (rules, order) {
        this.strings = rules;
        this.turnsOrder = order;
        this.table = [];
    }

    generateTable () {
        this.table = this.turnsOrder.map((turn) => {
            let cases = [];
            for (let i = 0; i < this.turnsOrder.length; i++) {
                if (this.strings[i].includes(turn)) {
                    cases.push('draw');
                } else if (this.strings[i][0].includes(turn)) {
                    cases.push('win');
                } else if (this.strings[i][2].includes(turn))
                    cases.push('lose');
            }
            return cases;
        })
        this.table = this.table.map((item, itemIndex)=>{
            item.unshift(this.turnsOrder[itemIndex]);
            return item
        })
        let header = this.turnsOrder.slice();
        header.unshift('turns');
        this.table.unshift(header)
    }

    showTable () {
        console.log(table(this.table));
    }
}

let newTurn = new Main(process);
newTurn.startNewGame();