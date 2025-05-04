"use client";

import { useState, useEffect } from 'react';
import { app, auth, db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function TestFirebase() {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);
  const [dbResult, setDbResult] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('Checking network...');

  useEffect(() => {
    // Test network connectivity
    const testNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { mode: 'no-cors' });
        setNetworkStatus('Network connection is available');
        return true;
      } catch (error) {
        setNetworkStatus('Network connection is not available');
        return false;
      }
    };

    const testFirebase = async () => {
      try {
        // First check network connectivity
        const networkAvailable = await testNetwork();
        if (!networkAvailable) {
          setError('Network connection is not available. Please check your internet connection.');
          return;
        }

        // Test if Firebase is initialized
        if (!app) {
          setTestResult('Firebase app not initialized');
          return;
        }

        setTestResult('Firebase app initialized successfully');

        // Log Firebase config for debugging
        console.log('Firebase config:', app.options);

        // Test Authentication only
        try {
          // Generate a random email to avoid conflicts
          const randomEmail = `test-${Math.random().toString(36).substring(2, 8)}@example.com`;
          console.log('Attempting to create user with email:', randomEmail);
          const userCredential = await createUserWithEmailAndPassword(auth, randomEmail, 'Test123!');
          setTestResult(`Authentication successful. User ID: ${userCredential.user.uid}`);
        } catch (authError: any) {
          console.error('Authentication error details:', authError);
          setError(`Authentication error: ${authError.message} (${authError.code})`);
        }
      } catch (error: any) {
        console.error('General error details:', error);
        setError(`General error: ${error.message}`);
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase Test</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Network Status:</h2>
        <p className="mt-2">{networkStatus}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Firebase App Status:</h2>
        <p className="mt-2">{testResult}</p>
      </div>

      {dbResult && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Firestore Status:</h2>
          <p className="mt-2">{dbResult}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
          <h2 className="text-xl font-semibold text-red-700">Error:</h2>
          <p className="mt-2 text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold">Firebase Configuration:</h2>
        <pre className="mt-2 overflow-auto p-2 bg-gray-200 rounded">
          {JSON.stringify(app?.options, null, 2)}
        </pre>
      </div>
    </div>
  );
}
