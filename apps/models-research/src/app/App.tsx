import { useState } from 'react';
import { GameDemo } from './GameDemo';
import { UserDemo } from './UserDemo';

export default function App() {
  const [tab, setTab] = useState<'game' | 'user'>('game');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h1>Effector Models Research</h1>
      <div style={{ marginBottom: 20 }}>
        <button
          disabled={tab === 'game'}
          onClick={() => setTab('game')}
          style={{
            marginRight: 10,
            fontWeight: tab === 'game' ? 'bold' : 'normal',
          }}
        >
          Game Model (Variants)
        </button>
        <button
          disabled={tab === 'user'}
          onClick={() => setTab('user')}
          style={{ fontWeight: tab === 'user' ? 'bold' : 'normal' }}
        >
          Chat User (Polymorphism)
        </button>
      </div>

      {tab === 'game' ? <GameDemo /> : <UserDemo />}
    </div>
  );
}
