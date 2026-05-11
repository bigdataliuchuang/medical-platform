import { useState, useRef, useEffect } from 'react';
import { FloatButton, Drawer, Input, Button, Typography, Collapse, Table, Spin, Tag } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import { sendChat, getSuggestions } from '../../api/chat';
import type { ChatMessage } from '../../api/chat';
import { v4 as uuidv4 } from 'uuid';

const { Text, Paragraph } = Typography;

function getSessionId(): string {
  let sid = sessionStorage.getItem('ai_session_id');
  if (!sid) {
    sid = uuidv4();
    sessionStorage.setItem('ai_session_id', sid);
  }
  return sid;
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0 && suggestions.length === 0) {
      getSuggestions(4).then(setSuggestions).catch(() => {});
    }
  }, [open, messages.length, suggestions.length]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await sendChat(getSessionId(), msg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          sql: res.sql || undefined,
          data: res.data?.length ? res.data : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '服务暂时不可用，请稍后重试。' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        tooltip="问数据"
        onClick={() => setOpen(true)}
        style={{ right: 24, bottom: 24, width: 48, height: 48 }}
      />
      <Drawer
        title="AI 数据助手"
        placement="right"
        width={400}
        open={open}
        onClose={() => setOpen(false)}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: 60 }}>
              <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>你好！我是 AI 数据助手</div>
              <div style={{ marginTop: 8, fontSize: 12 }}>输入问题即可查询医疗数据</div>
              {suggestions.length > 0 && (
                <div style={{ marginTop: 24, textAlign: 'left' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>你可以问我：</Text>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {suggestions.map((q, i) => (
                      <Tag
                        key={i}
                        style={{ cursor: 'pointer', padding: '4px 8px', whiteSpace: 'normal', lineHeight: 1.5 }}
                        onClick={() => handleSend(q)}
                      >
                        {q}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                  color: msg.role === 'user' ? '#fff' : '#333',
                }}
              >
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</Paragraph>
                {msg.sql && (
                  <Collapse
                    size="small"
                    items={[{ key: '1', label: '查看 SQL', children: <pre style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>{msg.sql}</pre> }]}
                    style={{ marginTop: 8 }}
                  />
                )}
                {msg.data && msg.data.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Table
                      size="small"
                      pagination={false}
                      scroll={{ x: true }}
                      dataSource={msg.data.slice(0, 5).map((row, i) => ({ ...row, _key: i }))}
                      rowKey="_key"
                      columns={Object.keys(msg.data[0]).slice(0, 5).map((col) => ({
                        title: col,
                        dataIndex: col,
                        key: col,
                        ellipsis: true,
                      }))}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f5f5f5' }}>
                <Spin size="small" /> <Text type="secondary">思考中...</Text>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
          <Input
            placeholder="输入你的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={() => handleSend()} loading={loading} />
        </div>
      </Drawer>
    </>
  );
}
