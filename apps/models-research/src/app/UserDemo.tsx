import { useUnit } from 'effector-react';
import { usersList } from '../user/index';
import {
  addGuest,
  addMember,
  kickUser,
  promoteUser,
  selectUser,
  $selectedUserId,
  $currentUserRole,
} from '../user/logic';
import { useState } from 'react';

export function UserDemo() {
  const [items, selectedId, role] = useUnit([
    usersList.$items,
    $selectedUserId,
    $currentUserRole,
  ]);
  const [kick, promote, select] = useUnit([kickUser, promoteUser, selectUser]);
  const [addG, addM] = useUnit([addGuest, addMember]);

  const [name, setName] = useState('John');

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>User Model Demo</h2>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <button onClick={() => addG(name)}>Add Guest</button>
        <button onClick={() => addM({ name, role: 'user' })}>
          Add Member (User)
        </button>
        <button onClick={() => addM({ name, role: 'admin' })}>
          Add Member (Admin)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 300, borderRight: '1px solid #eee' }}>
          <h3>Users List</h3>
          {items.length === 0 && <p>No users</p>}
          {items.map((id) => (
            <div
              key={id}
              onClick={() => select(id)}
              style={{
                padding: 8,
                cursor: 'pointer',
                background: id === selectedId ? '#eef' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #eee',
              }}
            >
              <span style={{ fontSize: '0.9em' }}>{id}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    promote(id);
                  }}
                  title="Promote"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    kick(id);
                  }}
                  title="Kick"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <h3>Selected User Details</h3>
          {selectedId ? (
            <div>
              <p>ID: {selectedId}</p>
              <p>
                Current Role: <strong>{String(role)}</strong>
              </p>
              <p style={{ fontSize: '0.8em', color: '#666' }}>
                Role is derived via <code>select().variant('member')...</code>.
                If user is guest, it falls back to "guest".
              </p>
            </div>
          ) : (
            <p>Select a user to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
