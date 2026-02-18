import { useState, useRef, useCallback, useEffect } from 'react';

export function useScale() {
    const [weight, setWeight] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isReading, setIsReading] = useState(false);
    const [isSupported] = useState('serial' in navigator);
    const [error, setError] = useState(null);

    // Refs to keep track of connection without triggering re-renders
    const portRef = useRef(null);
    const readerRef = useRef(null);
    const keepReadingRef = useRef(false);

    const parseWeight = (text) => {
        // Common Scale Patterns
        // Pattern 1: "ST,GS,+  1.50kg" (Stable, Gross, Value, Unit)
        // Pattern 2: "1.50" (Simple number)

        // Regex to find a number that might have decimal points
        const weightMatch = text.match(/[\d]+(\.[\d]+)?/);
        if (weightMatch) {
            return parseFloat(weightMatch[0]);
        }
        return null;
    };

    const readLoop = async () => {
        while (portRef.current && portRef.current.readable && keepReadingRef.current) {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        const parsed = parseWeight(value);
                        if (parsed !== null && !isNaN(parsed)) {
                            setWeight(parsed);
                        }
                    }
                }
            } catch (error) {
                console.error("Scale Read Error:", error);
                setError("Error leyendo datos de la báscula");
            } finally {
                reader.releaseLock();
            }
        }
    };

    const connect = useCallback(async () => {
        if (!isSupported) {
            setError("Web Serial API no soportada en este navegador (Usa Chrome/Edge)");
            return;
        }

        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 }); // Standard baud rate for most scales

            portRef.current = port;
            setIsConnected(true);
            setError(null);
            keepReadingRef.current = true;

            // Start reading loop
            readLoop();

        } catch (err) {
            console.error("Connection Error:", err);
            setError("No se pudo conectar a la báscula. Verifica permisos.");
        }
    }, [isSupported]);

    const disconnect = useCallback(async () => {
        keepReadingRef.current = false;

        if (readerRef.current) {
            await readerRef.current.cancel();
        }
        if (portRef.current) {
            await portRef.current.close();
            portRef.current = null;
        }

        setIsConnected(false);
        setWeight(0);
    }, []);

    const simulateConnection = useCallback(() => {
        setIsConnected(true);
        setError(null);
        keepReadingRef.current = true;

        // Simulate fluctuating weight
        const interval = setInterval(() => {
            if (!keepReadingRef.current) {
                clearInterval(interval);
                return;
            }
            // Random weight between 4.9 and 5.1
            const mockWeight = 4.9 + Math.random() * 0.2;
            setWeight(parseFloat(mockWeight.toFixed(2)));
        }, 500);

        // Store interval ID to clear it later if needed (simple version)
        portRef.current = { close: () => clearInterval(interval) };
    }, []);

    return {
        isSupported,
        isConnected,
        weight,
        error,
        connect,
        disconnect,
        simulateConnection
    };
}
