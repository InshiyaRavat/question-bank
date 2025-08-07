"use client";
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { THEME } from '@/theme';

export default function TwoFactorSetup() {
    const { user } = useUser();
    const [isEnabling2FA, setIsEnabling2FA] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState('initial'); // initial, qr, verify, complete

    const enable2FA = async () => {
        if (!user) return;

        setIsEnabling2FA(true);
        try {
            // Create TOTP (Time-based One-Time Password)
            const totp = await user.createTOTP();
            setQrCode(totp.qr);
            setBackupCodes(totp.backupCodes || []);
            setStep('qr');
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            alert('Failed to enable 2FA. Please try again.');
        } finally {
            setIsEnabling2FA(false);
        }
    };

    const verify2FA = async () => {
        if (!user || !verificationCode) return;

        setIsEnabling2FA(true);
        try {
            await user.verifyTOTP({ code: verificationCode });
            setStep('complete');
        } catch (error) {
            console.error('Error verifying 2FA:', error);
            alert('Invalid code. Please try again.');
        } finally {
            setIsEnabling2FA(false);
        }
    };

    const disable2FA = async () => {
        if (!user) return;

        const confirmed = confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.');
        if (!confirmed) return;

        try {
            await user.disableTOTP();
            setStep('initial');
            setQrCode('');
            setBackupCodes([]);
            setVerificationCode('');
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            alert('Failed to disable 2FA. Please try again.');
        }
    };

    if (!user) return null;

    const has2FA = user.twoFactorEnabled;

    return (
        <div className="bg-white p-6 rounded-xl border" style={{ borderColor: THEME.neutral300 }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: THEME.textPrimary }}>
                Two-Factor Authentication
            </h3>

            {step === 'initial' && (
                <div>
                    {has2FA ? (
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                <span style={{ color: THEME.textPrimary }}>Two-factor authentication is enabled</span>
                            </div>
                            <p className="text-sm mb-4" style={{ color: THEME.textSecondary }}>
                                Your account is protected with two-factor authentication.
                            </p>
                            <button
                                onClick={disable2FA}
                                className="px-4 py-2 border rounded-lg font-medium transition-colors hover:bg-red-50"
                                style={{
                                    borderColor: THEME.error,
                                    color: THEME.error
                                }}
                            >
                                Disable 2FA
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                                <span style={{ color: THEME.textPrimary }}>Two-factor authentication is disabled</span>
                            </div>
                            <p className="text-sm mb-4" style={{ color: THEME.textSecondary }}>
                                Add an extra layer of security to your account by enabling two-factor authentication.
                            </p>
                            <button
                                onClick={enable2FA}
                                disabled={isEnabling2FA}
                                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                style={{
                                    backgroundColor: THEME.primary,
                                    color: THEME.white
                                }}
                            >
                                {isEnabling2FA ? 'Setting up...' : 'Enable 2FA'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {step === 'qr' && (
                <div>
                    <h4 className="font-medium mb-4" style={{ color: THEME.textPrimary }}>
                        Step 1: Scan QR Code
                    </h4>
                    <p className="text-sm mb-4" style={{ color: THEME.textSecondary }}>
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    {qrCode && (
                        <div className="mb-6 p-4 bg-white border rounded-lg text-center">
                            <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
                        </div>
                    )}

                    {backupCodes.length > 0 && (
                        <div className="mb-6">
                            <h5 className="font-medium mb-2" style={{ color: THEME.textPrimary }}>
                                Backup Codes (Save these securely!)
                            </h5>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="font-mono text-sm text-gray-700 mb-1">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs mt-2" style={{ color: THEME.textMuted }}>
                                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => setStep('verify')}
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                            backgroundColor: THEME.primary,
                            color: THEME.white
                        }}
                    >
                        I&apos;ve Saved the Codes, Continue
                    </button>
                </div>
            )}

            {step === 'verify' && (
                <div>
                    <h4 className="font-medium mb-4" style={{ color: THEME.textPrimary }}>
                        Step 2: Verify Setup
                    </h4>
                    <p className="text-sm mb-4" style={{ color: THEME.textSecondary }}>
                        Enter the 6-digit code from your authenticator app to complete setup.
                    </p>

                    <div className="mb-4">
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 border rounded-lg text-center font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            style={{
                                borderColor: THEME.neutral300,
                                color: THEME.textPrimary
                            }}
                            maxLength={6}
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => setStep('qr')}
                            className="px-4 py-2 border rounded-lg font-medium transition-colors"
                            style={{
                                borderColor: THEME.neutral300,
                                color: THEME.textSecondary
                            }}
                        >
                            Back
                        </button>
                        <button
                            onClick={verify2FA}
                            disabled={isEnabling2FA || verificationCode.length !== 6}
                            className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            style={{
                                backgroundColor: THEME.primary,
                                color: THEME.white
                            }}
                        >
                            {isEnabling2FA ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'complete' && (
                <div>
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-semibold mb-2" style={{ color: THEME.textPrimary }}>
                            2FA Successfully Enabled!
                        </h4>
                        <p className="text-sm" style={{ color: THEME.textSecondary }}>
                            Your account is now protected with two-factor authentication.
                        </p>
                    </div>

                    <button
                        onClick={() => setStep('initial')}
                        className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                            backgroundColor: THEME.primary,
                            color: THEME.white
                        }}
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}