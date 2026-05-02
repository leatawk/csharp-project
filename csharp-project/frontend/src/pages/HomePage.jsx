import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🔒', title: 'Secure & Trusted', desc: 'Bank-level security with transparent fund tracking' },
  { icon: '👥', title: 'Community Driven', desc: 'Join groups with trusted friends and build financial resilience' },
  { icon: '💰', title: 'Flexible Payouts', desc: 'Fixed, random, bidding, and lottery payout options' },
  { icon: '📊', title: 'Full Transparency', desc: 'Real-time tracking of contributions, payouts, and activity' },
  { icon: '⚡', title: 'Auto Payments', desc: 'Set up automatic contributions and never miss a payment' },
  { icon: '📱', title: 'Mobile Friendly', desc: 'Manage groups and payments from anywhere, anytime' },
];

const steps = [
  { n: 1, title: 'Create or Join a Group', desc: 'Start a new ROSCA group or join one with an invite code' },
  { n: 2, title: 'Make Regular Contributions', desc: 'Pay on your agreed schedule — weekly, bi-weekly, or monthly' },
  { n: 3, title: 'Receive Your Payout', desc: "Get your payout when it's your turn based on your group's method" },
  { n: 4, title: 'Build Trust & Reputation', desc: 'On-time payments boost your trust score for premium groups' },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ background: 'white' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(145deg, var(--green-900) 0%, var(--green-800) 55%, var(--green-700) 100%)',
        color: 'white', padding: '100px 24px 120px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -150, right: -150 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', bottom: -100, left: -100 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600,
            marginBottom: 24, color: 'var(--green-200)',
          }}>
            The ancient savings tradition — now digital
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700,
            marginBottom: 20, lineHeight: 1.15,
          }}>
            Rotating Savings,<br />
            <span style={{ color: 'var(--green-300, #6EE7A0)' }}>Reimagined</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', opacity: 0.8, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Join a trusted community for rotating savings and credit associations — transparent, secure, and built for your community.
          </p>

          {!isAuthenticated ? (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn" style={{
                background: 'white', color: 'var(--green-800)',
                padding: '14px 36px', fontSize: 16, fontWeight: 700,
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}>
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-outline" style={{ padding: '14px 36px', fontSize: 16 }}>
                Sign In
              </Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn" style={{
              background: 'white', color: 'var(--green-800)',
              padding: '14px 36px', fontSize: 16, fontWeight: 700,
            }}>
              Go to Dashboard →
            </Link>
          )}

          {/* ROSCA explained */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 0, marginTop: 64,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 40,
          }}>
            {[
              { word: 'Rotating', desc: 'Each cycle, one member receives the full pool' },
              { word: 'Savings', desc: 'Everyone contributes a fixed amount regularly' },
              { word: 'Credit', desc: 'Early recipients get interest-free access to funds' },
              { word: 'Association', desc: 'Built on trust within your circle of people' },
            ].map(({ word, desc }) => (
              <div key={word} style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                  color: 'var(--green-300, #6EE7A0)', marginBottom: 6,
                }}>{word}</div>
                <div style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', background: 'var(--green-25)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,40px)', color: 'var(--text-primary)', marginBottom: 12 }}>
              Why choose ROSCA Platform?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Everything your savings circle needs, in one place.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {features.map((f) => (
              <div key={f.title} style={{
                background: 'white', borderRadius: 'var(--radius-lg)', padding: '28px',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 24px', background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,40px)', color: 'var(--text-primary)', marginBottom: 12 }}>
              How it works
            </h2>
          </div>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', gap: 24, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--green-800), var(--green-600))',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, boxShadow: '0 4px 12px rgba(13,92,58,0.3)',
                  }}>{s.n}</div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border)', margin: '6px 0' }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < steps.length - 1 ? 32 : 0, paddingTop: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section style={{
          background: 'linear-gradient(135deg, var(--green-800), var(--green-700))',
          padding: '72px 24px', textAlign: 'center',
        }}>
          <div className="container">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,40px)', color: 'white', marginBottom: 16 }}>
              Ready to start saving together?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, marginBottom: 36 }}>
              Join thousands of members already building wealth as a community.
            </p>
            <Link to="/register" className="btn" style={{
              background: 'white', color: 'var(--green-800)',
              padding: '14px 40px', fontSize: 16, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}>
              Create Free Account
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: 'var(--green-900)', padding: '36px 24px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'white', marginBottom: 16 }}>ROSCA Platform</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>© 2026 ROSCA Platform. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['About', 'Terms', 'Privacy', 'Contact'].map(l => (
              <Link key={l} to={`/${l.toLowerCase()}`} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
