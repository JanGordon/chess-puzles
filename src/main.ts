
class Piece {
    img: string
    side: string
    name: string
    moves: number
    row: number
    col: number
    boardController: BoardController
    valMove: (row: number, col: number)=>boolean
    constructor (img: string, side: string, name: string, row: number, col: number, boardContoller: BoardController ) {
        this.img = img
        this.side = side
        this.name = name
        this.moves = 0
        this.row = row
        this.col = col
        this.boardController = boardContoller
        this.valMove = (row: number, col: number)=>true
    }
    confirmMove() {
        this.moves++
    }
    select() {
        console.log(this.col, this.row)
        this.boardController.board.querySelectorAll(".square")[this.row*8+this.col].classList.add("selected")
    }
}

class Pawn extends Piece {
    constructor(side: string, row: number, col: number, boardController: BoardController) {
        super("/src/pawn.svg", side, "Pawn", row, col, boardController)

        this.valMove = (row: number, col: number): boolean => {
            if (this.moves == 0) {
                if (row == this.row+1 || row == this.row+2) {
                    return this.col == col
                }
            } else {
                if (row == this.row+1) {
                    return this.col == col
                }
            }
            return false
        }
    }
}

class Rook extends Piece {
    constructor(side: string, row: number, col: number, boardController: BoardController) {
        super("/src/rook.svg", side, "Rook", row, col, boardController)
    }
}

class Knight extends Piece {
    constructor(side: string, row: number, col: number, boardController: BoardController) {
        super("/src/knight.svg", side, "Knight", row, col, boardController)
    }
}

class Bishop extends Piece {
    constructor(side: string, row: number, col: number, boardController: BoardController) {
        super("/src/bishop.svg", side, "Bishop", row, col, boardController)
    }
}

class Queen extends Piece {
    constructor(side: string, row: number, col: number, boardController: BoardController) {
        super("/src/queen.svg", side, "Queen", row, col, boardController)
    }
}

class King extends Piece {
    constructor(side: string, row: number, col: number, boardController: BoardController) {
        super("/src/king.svg", side, "King", row, col, boardController)
    }
}

class BoardLayout {
    layout: Piece[][]
    name: string
    constructor(layout: Piece[][], name: string) {
        this.layout = layout
        this.name = name
    }
}

const pieceDictionary = {
    "pawn": Pawn,
    "rook": Rook,
    "knight": Knight,
    "bishop": Bishop,
    "queen": Queen,
    "king": King
}

type JSONBoardLayout = {type: string, side: string}[][]

function makeArray<Type>(width: number, h: number, val: Type): Type[][]  {
    var arr: Type[][] = [];
    for(let i = 0; i < h; i++) {
        arr[i] = [];
        for(let j = 0; j < width; j++) {
            arr[i][j] = val;
        }
    }
    return arr;
}




class BoardController {
    layouts: BoardLayout[]
    layout: BoardLayout | undefined
    board: HTMLElement
    constructor(board: HTMLElement) {
        this.layouts = []
        this.board = board
        
    }
    setPieceOnSquare(piece: Piece, row: number, col: number) {
        this.board.querySelectorAll(".square")[row*8+col].innerHTML = piece.name 
    }

    getPieceOnSquare(row: number, col: number): Piece | undefined {
        console.log(this.layout?.layout, row, col)
        return this.layout?.layout[row][col]
    }

    setBoardLayout(layout: BoardLayout) {
        this.layout = layout
        for (let row = 0; row < layout.layout.length; row++) {
            let rowArray = layout.layout[row]
            for (let piece = 0; piece < rowArray.length; piece++) {
                this.setPieceOnSquare(rowArray[piece], row, piece)
            }
        }
    }

    loadLayouts(): Promise<BoardLayout[]> {
        return new Promise<BoardLayout[]>((res)=>{
            let boardRequests: Promise<BoardLayout>[] = []
            fetch("/src/layout-index.json")
                .then((res: Response)=>res.json())
                .then((v)=>{
                    for (let b of v) {
                        console.log(b)
                        boardRequests.push(new Promise<BoardLayout>((res)=>{fetch("/src/layouts/"+b)
                        .then((res: Response)=>res.json())
                        .then((value: JSONBoardLayout)=>{
                            let layout: Piece[][] = []
                            for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
                                layout.push([])
                                for (let pieceIndex = 0; pieceIndex < value[rowIndex].length; pieceIndex++) {
                                    let pieceInJSON = value[rowIndex][pieceIndex]
                                    let p = pieceDictionary[pieceInJSON.type as keyof typeof pieceDictionary]
                                    layout[rowIndex].push(new p(pieceInJSON.side, rowIndex, pieceIndex, this))
                                }
                            }
                            console.log("e")
                            res(new BoardLayout(layout, b))
                        })}))
                    }
                    Promise.all(boardRequests)
                    .then((layouts: BoardLayout[])=>{
                        console.log("reolce")
                        res(layouts)
                    })
                })
            
        })
        
    }

    async init(defaultLayoutName: string) {
        this.layouts = await this.loadLayouts()
        for (let layout of this.layouts) {
            if (layout.name == defaultLayoutName) {
                this.layout = layout
            }
        }
        if (this.layout == undefined) {
            console.error("no layout withe name", defaultLayoutName, "was found")
            this.layout = this.layouts[0]
        }
        console.log(this.layouts)
        var squares = this.board.querySelectorAll(".square")!
        var squareIndex = 0
        for (let squareIndex = 0; squareIndex < squares.length; squareIndex++)  {
            squares[squareIndex].addEventListener("pointerdown", ()=>{
                let row = Math.floor(squareIndex/8)
                let col = squareIndex%8
                console.log(squareIndex)
                this.getPieceOnSquare(row, col)!.select()
            })
        }
    }
}

let b = new BoardController(document.getElementById("board")!)
b.init("default.json")
.then(()=>{
    b.setBoardLayout(b.layouts[0])
})
