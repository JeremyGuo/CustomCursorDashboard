import React from 'react';

interface Props {
  context?: Window['__SERVICE_CONTEXT__'];
}

const App: React.FC<Props> = ({ context }) => {
  if (!context) {
    return <p>无法加载服务上下文。</p>;
  }
  const { service, user } = context;
  return (
    <main style={{ fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#888', marginBottom: '0.25rem' }}>当前用户：{user?.username}</p>
        <h1 style={{ margin: 0 }}>{service.name}</h1>
        <p style={{ color: '#555' }}>{service.description}</p>
      </header>
      <section>
        <h2>API 代理</h2>
        <p>
          当前服务前端调用 <code>{service.id}/api/…</code> 时，将自动转发到 <code>
            {service.proxy.rewrite}
          </code>{' '}
          路径。
        </p>
      </section>
    </main>
  );
};

export default App;
