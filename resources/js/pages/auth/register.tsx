import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { useState } from 'react';
import { Sparkles, UserPlus, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Daftar Akun Pasien Baru - Klinik Wansha" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="d-flex flex-column gap-2"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="mb-3">
                            <label className="form-label fw-bold" htmlFor="name" style={{ color: '#173F3C' }}>
                                Nama Lengkap Pasien
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                className="form-control"
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold" htmlFor="email" style={{ color: '#173F3C' }}>
                                Alamat Email Aktif
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="form-control"
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold" htmlFor="password" style={{ color: '#173F3C' }}>
                                Kata Sandi
                            </label>
                            <div className="input-group input-group-flat">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className="form-control"
                                />
                                <span className="input-group-text">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="link-secondary border-0 bg-transparent p-0"
                                        title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                                    >
                                        {showPassword ? <EyeOff className="icon" /> : <Eye className="icon" />}
                                    </button>
                                </span>
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-bold" htmlFor="password_confirmation" style={{ color: '#173F3C' }}>
                                Konfirmasi Kata Sandi
                            </label>
                            <input
                                id="password_confirmation"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                name="password_confirmation"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                placeholder="Ulangi kata sandi"
                                className="form-control"
                            />
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        <div className="form-footer mt-2">
                            <button
                                type="submit"
                                tabIndex={5}
                                disabled={processing}
                                className="btn btn-primary w-100 py-2 fs-5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            >
                                {processing ? (
                                    <Spinner className="icon" />
                                ) : (
                                    <>
                                        <span>Daftarkan Akun Pasien</span>
                                        <ArrowRight className="icon" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center text-secondary small mt-3 pt-3 border-top">
                            Sudah memiliki akun terdaftar?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={6}
                                className="fw-bold text-primary text-decoration-none"
                            >
                                Masuk ke Akun
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Pendaftaran Pasien Baru',
    description: 'Buat akun untuk melakukan reservasi dan mendapatkan tiket antrean digital',
};
