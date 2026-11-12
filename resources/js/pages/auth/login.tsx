import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Masuk ke Akun - Klinik Wansha" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="d-flex flex-column gap-2"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="mb-3">
                            <label className="form-label fw-bold" htmlFor="email" style={{ color: '#173F3C' }}>
                                Alamat Email Terdaftar
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="nama@email.com"
                                className="form-control"
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                                <label className="form-label fw-bold mb-0" htmlFor="password" style={{ color: '#173F3C' }}>
                                    Kata Sandi
                                </label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-secondary small text-decoration-none"
                                        tabIndex={5}
                                    >
                                        Lupa kata sandi?
                                    </TextLink>
                                )}
                            </div>
                            <div className="input-group input-group-flat">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    required
                                    tabIndex={2}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    placeholder="Masukkan kata sandi"
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
                            <label className="form-check">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    tabIndex={3}
                                    className="form-check-input"
                                />
                                <span className="form-check-label text-secondary small">
                                    Ingat saya di perangkat ini
                                </span>
                            </label>
                        </div>

                        <div className="form-footer mt-2">
                            <button
                                type="submit"
                                tabIndex={4}
                                disabled={processing}
                                className="btn btn-primary w-100 py-2 fs-5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            >
                                {processing ? (
                                    <Spinner className="icon" />
                                ) : (
                                    <>
                                        <span>Masuk ke Sistem Antrean</span>
                                        <ArrowRight className="icon" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center text-secondary small mt-3 pt-3 border-top">
                            Belum memiliki akun reservasi?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={5}
                                className="fw-bold text-primary text-decoration-none"
                            >
                                Daftar Akun Pasien Baru
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="alert alert-success mt-3 py-2 text-center small" role="alert">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Akun Anda',
    description: 'Akses nomor antrean, jadwal dokter, dan reservasi online di Klinik Wansha',
};
