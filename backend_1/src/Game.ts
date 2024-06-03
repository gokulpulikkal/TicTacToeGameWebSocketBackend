import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE, PLAYER1_SYMBOL, PLAYER2_SYMBOL } from "./Messages";
import { Move } from "./Move";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private currentPlayer: WebSocket;
    private board: string[][];
    private moves: string[];
    private startTime: Date;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;

        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.moves = [];
        this.startTime = new Date();
        this.currentPlayer = player1;

        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                symbol: PLAYER1_SYMBOL,
                isYourTurn: this.currentPlayer === this.player1
            }
        }));
        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                symbol: PLAYER2_SYMBOL,
                isYourTurn: this.currentPlayer === this.player2
            }
        }));
    }

    resetGame() {
        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.moves = [];
        this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        this.sendUpdatedBoardToPlayers()
    }

    makeMove(socket: WebSocket, move: Move) {
        // Validation of move
        if (socket !== this.currentPlayer) {
            console.error('Not this player\'s turn');
            return;
        }

        if (this.board[move.row][move.col] !== '') {
            console.error('Invalid move');
            return;
        }

        // update the board
        // push the move
        const symbol = socket === this.player1 ? PLAYER1_SYMBOL : PLAYER2_SYMBOL;
        this.board[move.row][move.col] = symbol;
        this.moves.push(`${symbol} at ${move.row},${move.col}`);

        // check if the game over

        if (this.checkWin(symbol)) {
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: socket === this.player1 ? PLAYER1_SYMBOL : PLAYER2_SYMBOL,
                    board: this.board,
                }
            }));
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: socket === this.player1 ? PLAYER1_SYMBOL : PLAYER2_SYMBOL,
                    board: this.board,
                }
            }));
            return;
        }

        if (this.isDraw()) {
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: 'Draw',
                    board: this.board,
                }
            }));
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: 'Draw',
                    board: this.board,
                }
            }));
            return;
        }

        // send the updated board to both players
        this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
        this.sendUpdatedBoardToPlayers()
        
    }

    sendUpdatedBoardToPlayers() {
        this.player1.send(JSON.stringify({
            type: MOVE,
            payload: {
                board: this.board,
                isYourTurn: this.currentPlayer === this.player1
            }
        }));
        this.player2.send(JSON.stringify({
            type: MOVE,
            payload: {
                board: this.board,
                isYourTurn: this.currentPlayer === this.player2
            }
        }));
    }

    checkWin(symbol: string): boolean {
        // Check rows, columns, and diagonals
        const winPatterns = [
            // Rows
            [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }],
            [{ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }],
            [{ r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
            // Columns
            [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }],
            [{ r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }],
            [{ r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 2 }],
            // Diagonals
            [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }],
            [{ r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }]
        ];

        return winPatterns.some(pattern => 
            pattern.every(pos => this.board[pos.r][pos.c] === symbol)
        );
    }

    isDraw(): boolean {
        return this.board.every(row => row.every(cell => cell !== ''));
    }
}

