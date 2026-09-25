import React, { useState } from 'react';
import { eduUsersApi, type EduUser } from '../services/eduApi';
import { getLearnerId, getLearnerName, setLearner } from '../services/learnerStore';

interface Props {
  onBound: () => void;
}

export const LearnerBind: React.FC<Props> = ({ onBound }) => {
  const [adminId, setAdminId] = useState(String(getLearnerId() || 1));
  const [manualId, setManualId] = useState(String(getLearnerId() || ''));
  const [manualName, setManualName] = useState(getLearnerName());
  const [users, setUsers] = useState<EduUser[]>([]);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setError('');
    try {
      const res = await eduUsersApi.list(Number(adminId) || 1);
      setUsers(res.users || []);
    } catch (err) {
      setUsers([]);
      setError('用户列表需要 0506 管理员账号。也可以直接填写学习者编号。');
    }
  };

  const bind = (id: number, name: string) => {
    if (!id) return;
    setLearner(id, name || `学习者 ${id}`);
    onBound();
  };

  return (
    <div className="insight-split" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
        {getLearnerId() ? `当前学习者：${getLearnerName() || getLearnerId()}` : '尚未绑定 0506 学习者'}
      </span>
      <input
        aria-label="管理员编号"
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        style={inputStyle}
        placeholder="管理员编号"
      />
      <button type="button" className="btn btn-secondary" onClick={loadUsers}>读取用户</button>
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          className="btn btn-secondary"
          onClick={() => bind(user.id, user.username)}
        >
          {user.username}
        </button>
      ))}
      <input
        aria-label="学习者编号"
        value={manualId}
        onChange={(e) => setManualId(e.target.value)}
        style={inputStyle}
        placeholder="学习者编号"
      />
      <input
        aria-label="学习者姓名"
        value={manualName}
        onChange={(e) => setManualName(e.target.value)}
        style={inputStyle}
        placeholder="姓名"
      />
      <button type="button" className="btn btn-primary" onClick={() => bind(Number(manualId), manualName)}>
        绑定
      </button>
      {error && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>{error}</span>}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--border-glass)',
  background: 'var(--bg-surface)',
  color: 'var(--text-main)',
  width: 120,
};
