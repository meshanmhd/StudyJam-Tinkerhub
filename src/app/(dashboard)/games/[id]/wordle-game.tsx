'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitGameResult } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Zap, RotateCcw, Keyboard } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd'

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
]

interface TileData {
    letter: string
    state: LetterState
}

type KeyState = Record<string, LetterState>

const MAX_GUESSES = 6

// ─── Dictionary validation ────────────────────────────────────────────────────

async function isRealWord(word: string): Promise<boolean> {
    try {
        const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
            { cache: 'no-store' }
        )
        return res.ok
    } catch {
        // If API is unreachable, allow the word (fail open)
        return true
    }
}

// ─── Wordle evaluation logic ──────────────────────────────────────────────────

function evaluateGuess(guess: string, target: string): LetterState[] {
    const result: LetterState[] = Array(guess.length).fill('absent')
    const targetLetters = target.split('')
    const guessLetters = guess.split('')

    const remaining: Record<string, number> = {}
    for (const l of targetLetters) {
        remaining[l] = (remaining[l] || 0) + 1
    }

    // Pass 1: greens
    for (let i = 0; i < guessLetters.length; i++) {
        if (guessLetters[i] === targetLetters[i]) {
            result[i] = 'correct'
            remaining[guessLetters[i]]--
        }
    }

    // Pass 2: yellows
    for (let i = 0; i < guessLetters.length; i++) {
        if (result[i] === 'correct') continue
        const l = guessLetters[i]
        if (remaining[l] && remaining[l] > 0) {
            result[i] = 'present'
            remaining[l]--
        }
    }

    return result
}

// ─── Tile Component ────────────────────────────────────────────────────────

function Tile({
    letter,
    state,
    animClass,
    index,
    revealDelay,
}: {
    letter: string
    state: LetterState
    animClass?: string
    index: number
    revealDelay?: boolean
}) {
    const bgMap: Record<LetterState, string> = {
        correct: 'bg-[#6aaa64] border-[#6aaa64] text-white',
        present: 'bg-[#c9b458] border-[#c9b458] text-white',
        absent: 'bg-[#3a3a3c] border-[#3a3a3c] text-white',
        empty: 'bg-transparent border-[#3a3a3c] text-foreground',
        tbd: 'bg-transparent border-[#565758] text-foreground',
    }

    return (
        <div
            className={`
                w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center
                border-2 text-base sm:text-xl font-bold uppercase select-none
                transition-all duration-100
                ${bgMap[state]}
                ${animClass || ''}
            `}
            style={
                revealDelay && state !== 'empty' && state !== 'tbd'
                    ? { animationDelay: `${index * 300}ms` }
                    : undefined
            }
        >
            {letter}
        </div>
    )
}

// ─── Format time ─────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
}

// ─── Main Wordle Game Component ───────────────────────────────────────────────

export function WordleGame({
    gameId,
    targetWord,
}: {
    gameId: string
    targetWord: string
    wordList?: string[]
}) {
    const router = useRouter()
    const wordLen = targetWord.length
    const hiddenInputRef = useRef<HTMLInputElement>(null)

    const [board, setBoard] = useState<TileData[][]>(() =>
        Array.from({ length: MAX_GUESSES }, () =>
            Array.from({ length: wordLen }, () => ({ letter: '', state: 'empty' as LetterState }))
        )
    )
    const [currentRow, setCurrentRow] = useState(0)
    const [currentTiles, setCurrentTiles] = useState<string[]>(Array(wordLen).fill(''))
    const [keyStates, setKeyStates] = useState<KeyState>({})
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
    const [invalidMsg, setInvalidMsg] = useState('')
    const [shakeRow, setShakeRow] = useState<number | null>(null)
    const [revealRow, setRevealRow] = useState<number | null>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [startTime] = useState(() => Date.now())

    function showInvalid(msg: string) {
        setInvalidMsg(msg)
        setTimeout(() => setInvalidMsg(''), 1800)
    }

    function triggerShake(row: number) {
        setShakeRow(row)
        setTimeout(() => setShakeRow(null), 600)
    }

    const handleKey = useCallback(async (key: string) => {
        if (gameState !== 'playing' || isValidating) return

        if (key === 'Backspace' || key === '⌫') {
            setCurrentTiles(prev => {
                const next = [...prev]
                const lastFilled = next.map((l, i) => l ? i : -1).filter(i => i >= 0).pop()
                if (lastFilled !== undefined) next[lastFilled] = ''
                return next
            })
            return
        }

        if (key === 'Enter') {
            const guess = currentTiles.join('')

            if (guess.length !== wordLen) {
                showInvalid(`Word must be ${wordLen} letters`)
                triggerShake(currentRow)
                return
            }

            // Validate against real English dictionary
            setIsValidating(true)
            const valid = await isRealWord(guess)
            setIsValidating(false)

            if (!valid) {
                showInvalid('Not a real word')
                triggerShake(currentRow)
                return
            }

            const results = evaluateGuess(guess, targetWord)
            const won = results.every(r => r === 'correct')

            setBoard(prev => {
                const next = prev.map(r => [...r])
                for (let i = 0; i < wordLen; i++) {
                    next[currentRow][i] = { letter: guess[i], state: results[i] }
                }
                return next
            })

            setRevealRow(currentRow)
            setTimeout(() => setRevealRow(null), wordLen * 300 + 400)

            setKeyStates(prev => {
                const next = { ...prev }
                for (let i = 0; i < guess.length; i++) {
                    const l = guess[i]
                    const existing = next[l]
                    const res = results[i]
                    if (res === 'correct') {
                        next[l] = 'correct'
                    } else if (res === 'present' && existing !== 'correct') {
                        next[l] = 'present'
                    } else if (!existing) {
                        next[l] = 'absent'
                    }
                }
                return next
            })

            const newRow = currentRow + 1
            const lost = !won && newRow >= MAX_GUESSES

            if (won || lost) {
                const timeTaken = Math.floor((Date.now() - startTime) / 1000)
                const guessesArr: string[] = []
                for (let r = 0; r < currentRow; r++) {
                    guessesArr.push(board[r].map(t => t.letter).join(''))
                }
                guessesArr.push(guess)

                setTimeout(async () => {
                    setGameState(won ? 'won' : 'lost')
                    setIsSubmitting(true)
                    await submitGameResult(gameId, won, guessesArr, timeTaken)
                    setIsSubmitting(false)
                    setTimeout(() => setShowResult(true), 500)
                }, won ? wordLen * 300 + 600 : 400)
            }

            setCurrentRow(newRow)
            setCurrentTiles(Array(wordLen).fill(''))
            return
        }



        if (/^[A-Za-z]$/.test(key)) {
            const upper = key.toUpperCase()
            setCurrentTiles(prev => {
                const next = [...prev]
                const emptyIdx = next.findIndex(l => !l)
                if (emptyIdx >= 0) next[emptyIdx] = upper
                return next
            })
        }
    }, [gameState, isValidating, currentTiles, currentRow, wordLen, targetWord, board, gameId, startTime])

    // Physical keyboard + mobile keyboard support
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.ctrlKey || e.metaKey || e.altKey) return
            if (e.key === 'Enter') handleKey('Enter')
            else if (e.key === 'Backspace') handleKey('Backspace')
            else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [handleKey])

    // Keep hidden input focused for mobile keyboard
    function ensureFocused() {
        hiddenInputRef.current?.focus()
    }

    const displayBoard = board.map((row, rowIdx) => {
        if (rowIdx === currentRow) {
            return currentTiles.map((letter, i) => ({
                letter,
                state: letter ? ('tbd' as LetterState) : ('empty' as LetterState),
            }))
        }
        if (rowIdx < currentRow) return row
        return row.map(() => ({ letter: '', state: 'empty' as LetterState }))
    })

    const isWon = gameState === 'won'

    return (
        <div className="flex flex-col items-center gap-6" onClick={ensureFocused}>
            {/* Hidden input to trigger mobile keyboards */}
            <input
                ref={hiddenInputRef}
                className="fixed opacity-0 pointer-events-none w-0 h-0"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey || e.altKey) return
                    if (e.key === 'Enter') handleKey('Enter')
                    else if (e.key === 'Backspace') handleKey('Backspace')
                    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key)
                }}
                onChange={() => {
                    // Keep value empty — we capture keys via onKeyDown
                    if (hiddenInputRef.current) hiddenInputRef.current.value = ''
                }}
            />
            {/* Toast */}
            {invalidMsg && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-lg shadow-xl">
                    {invalidMsg}
                </div>
            )}

            {/* Validating indicator */}
            {isValidating && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-muted/80 backdrop-blur text-foreground text-sm px-4 py-2 rounded-lg shadow-xl animate-pulse">
                    Checking word…
                </div>
            )}

            {/* Result Dialog */}
            <Dialog open={showResult} onOpenChange={setShowResult}>
                <DialogContent className="sm:max-w-sm text-center dialog-stroke">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl">
                            {isWon ? '🎉 You solved it!' : '😔 Game Over'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-lg font-mono font-bold tracking-[0.3em]">{targetWord}</p>
                        {isWon ? (
                            <p className="text-muted-foreground text-sm">
                                Solved in <strong>{currentRow}</strong> {currentRow === 1 ? 'guess' : 'guesses'}
                            </p>
                        ) : (
                            <p className="text-muted-foreground text-sm">Better luck next time!</p>
                        )}
                        <div className="flex items-center justify-center gap-1 text-sm text-amber-400 font-semibold">
                            <Zap size={14} />
                            Result submitted!
                        </div>
                        <Button onClick={() => router.push('/games')} className="w-full gap-2">
                            <RotateCcw size={14} />
                            Back to Games
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Instruction hint */}
            <p className="text-xs text-muted-foreground text-center">
                Guess the {wordLen}-letter word!
            </p>

            {/* Game Grid */}
            <div className="grid gap-1.5 mb-6 pointer-events-none" style={{ gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)` }}>
                {displayBoard.map((row, rowIdx) => (
                    <div
                        key={rowIdx}
                        className={`flex gap-1.5 ${shakeRow === rowIdx ? 'wordle-shake' : ''} ${isWon && rowIdx === currentRow - 1 ? 'wordle-bounce' : ''
                            }`}
                    >
                        {row.map((tile, colIdx) => (
                            <Tile
                                key={colIdx}
                                letter={tile.letter}
                                state={tile.state}
                                index={colIdx}
                                revealDelay={revealRow === rowIdx}
                                animClass={revealRow === rowIdx && tile.state !== 'empty' && tile.state !== 'tbd' ? 'wordle-flip' : ''}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* On-Screen Keyboard */}
            <div className="flex flex-col gap-2 w-full max-w-[500px] px-2 touch-manipulation">
                {KEYBOARD_ROWS.map((row, rIdx) => (
                    <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2">
                        {row.map((key) => {
                            const upperKey = key.toUpperCase()
                            const lowerKey = key.toLowerCase()
                            const state = keyStates[lowerKey] || keyStates[upperKey]
                            let bgClass = 'bg-muted text-foreground'
                            if (state === 'correct') bgClass = 'bg-[#6aaa64] text-white'
                            else if (state === 'present') bgClass = 'bg-[#c9b458] text-white'
                            else if (state === 'absent') bgClass = 'bg-[#3a3a3c] text-white'

                            const isSpecial = key === 'Enter' || key === '⌫'

                            // Check for repeating letters that are discovered
                            let repeatCount = 0
                            if (!isSpecial && (state === 'correct' || state === 'present')) {
                                repeatCount = targetWord.split('').filter(l => l.toUpperCase() === upperKey).length
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleKey(key)
                                    }}
                                    className={`relative
                                        h-14 sm:h-16 rounded font-bold transition-colors active:scale-95 flex items-center justify-center
                                        ${isSpecial ? 'px-3 sm:px-4 text-xs sm:text-sm' : 'flex-1 max-w-[44px] sm:max-w-[50px] text-base sm:text-lg'}
                                        ${bgClass}
                                    `}
                                >
                                    {key}
                                    {repeatCount > 1 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow border border-background">
                                            {repeatCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>

            {isSubmitting && (
                <p className="text-xs text-muted-foreground animate-pulse mt-4">Submitting result…</p>
            )}
        </div>
    )
}
