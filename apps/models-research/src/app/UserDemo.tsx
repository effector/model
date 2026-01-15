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
  $currentUserName,
} from '../user/logic';
import { useState, useMemo } from 'react';
import { select as selectLens } from '@effector-model/core-experimental';

function UserItem({
  id,
  selectedId,
  onSelect,
  onPromote,
  onKick,
  onRemove,
}: {
  id: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPromote: (id: string) => void;
  onKick: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const $name = useMemo(() => {
    return selectLens(usersList.getItem(id).facets.user.$nickname).fallback('');
  }, [id]);

  const name = useUnit($name);
  const isSelected = id === selectedId;

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-indigo-50 border-indigo-100 ring-1 ring-indigo-200 shadow-sm'
          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
      }`}
    >
      <div className="flex flex-col truncate max-w-[120px]">
        <span className="text-sm font-medium text-gray-900 truncate">
          {name || 'No Name'}
        </span>
        <span className="text-xs text-gray-400 truncate">{id}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPromote(id);
          }}
          title="Promote"
          className="p-1.5 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
        >
          ↑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onKick(id);
          }}
          title="Kick"
          className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
        >
          ×
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          title="Remove"
          className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export function UserDemo() {
  const [items, selectedId, role, currentUserName] = useUnit([
    usersList.$items,
    $selectedUserId,
    $currentUserRole,
    $currentUserName,
  ]);
  const [kick, promote, select] = useUnit([kickUser, promoteUser, selectUser]);
  const [addG, addM] = useUnit([addGuest, addMember]);
  const [remove] = useUnit([usersList.remove]);

  const [name, setName] = useState('John');
  const [userType, setUserType] = useState('guest');

  const handleAdd = () => {
    if (userType === 'guest') {
      addG(name);
    } else if (userType === 'member_user') {
      addM({ name, role: 'user' });
    } else if (userType === 'member_admin') {
      addM({ name, role: 'admin' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        User Model Demo
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Left Column: Form + Info */}
        <div className="sm:col-span-2 space-y-8">
          {/* Form */}
          <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-lg">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-grow sm:flex-grow-0"
            />
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white cursor-pointer"
            >
              <option value="guest">Guest</option>
              <option value="member_user">Member (User)</option>
              <option value="member_admin">Member (Admin)</option>
            </select>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
            >
              Add
            </button>
          </div>

          {/* Selected User Details */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Selected User Details
            </h3>
            {selectedId ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    ID
                  </span>
                  <p className="text-lg font-mono text-gray-800">
                    {selectedId}
                  </p>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </span>
                  <p className="text-lg font-mono text-gray-800">
                    {currentUserName}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Current Role
                  </span>
                  <p className="text-lg font-medium text-indigo-700 flex items-center gap-2">
                    {String(role)}
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        String(role) === 'admin'
                          ? 'bg-purple-500'
                          : String(role) === 'user'
                            ? 'bg-indigo-500'
                            : 'bg-gray-400'
                      }`}
                    ></span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8">
                <p className="text-gray-400">Select a user to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: List */}
        <div className="sm:col-span-1 border-t sm:border-t-0 sm:border-l border-gray-100 pt-8 sm:pt-0 sm:pl-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Users List
          </h3>
          {items.length === 0 && (
            <p className="text-gray-400 italic text-sm">No users</p>
          )}
          <div className="space-y-2">
            {items.map((id) => (
              <UserItem
                key={id}
                id={id}
                selectedId={selectedId}
                onSelect={select}
                onPromote={promote}
                onKick={kick}
                onRemove={remove}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
