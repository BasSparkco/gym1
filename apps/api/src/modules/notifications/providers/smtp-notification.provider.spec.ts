import nodemailer from 'nodemailer';
import { SmtpNotificationProvider } from './smtp-notification.provider';

jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn();
  const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));
  return {
    createTransport: mockCreateTransport,
    mockSendMail,
    mockCreateTransport,
  };
});

type MockedNodemailer = typeof nodemailer & {
  mockSendMail: jest.Mock;
  mockCreateTransport: jest.Mock;
};

const mockedNodemailer = nodemailer as unknown as MockedNodemailer;
const mockSendMail = mockedNodemailer.mockSendMail;
const mockCreateTransport = mockedNodemailer.mockCreateTransport;

describe('SmtpNotificationProvider', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('fails without crashing when SMTP credentials are not configured', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const provider = new SmtpNotificationProvider();
    const result = await provider.send({
      channel: 'email',
      to: 'member@example.com',
      from: 'notices@example.com',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result.status).toBe('failed');
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  it('fails when no sender address is configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASSWORD = 'pass';

    const provider = new SmtpNotificationProvider();
    const result = await provider.send({
      channel: 'email',
      to: 'member@example.com',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result.status).toBe('failed');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends an email through the configured SMTP transport', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASSWORD = 'pass';
    mockSendMail.mockResolvedValue({ messageId: 'abc' });

    const provider = new SmtpNotificationProvider();
    const result = await provider.send({
      channel: 'email',
      to: 'member@example.com',
      from: 'notices@example.com',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result.status).toBe('sent');
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        auth: { user: 'user', pass: 'pass' },
      }),
    );
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'notices@example.com',
      to: 'member@example.com',
      subject: 'Membership expiring',
      text: 'Your membership expires soon.',
    });
  });

  it('returns a failed result when sendMail rejects', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASSWORD = 'pass';
    mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

    const provider = new SmtpNotificationProvider();
    const result = await provider.send({
      channel: 'email',
      to: 'member@example.com',
      from: 'notices@example.com',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result).toEqual({
      status: 'failed',
      error: 'SMTP connection refused',
    });
  });
});
