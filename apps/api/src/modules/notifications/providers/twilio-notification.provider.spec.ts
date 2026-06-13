import twilio from 'twilio';
import { TwilioNotificationProvider } from './twilio-notification.provider';

jest.mock('twilio', () => {
  const mockMessagesCreate = jest.fn();
  const mockTwilioFactory = jest.fn(() => ({
    messages: { create: mockMessagesCreate },
  }));
  return Object.assign(mockTwilioFactory, { mockMessagesCreate });
});

type MockedTwilioFactory = jest.Mock & { mockMessagesCreate: jest.Mock };

const mockTwilioFactory = twilio as unknown as MockedTwilioFactory;
const mockMessagesCreate = mockTwilioFactory.mockMessagesCreate;

describe('TwilioNotificationProvider', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('fails without crashing when Twilio credentials are not configured', async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;

    const provider = new TwilioNotificationProvider();
    const result = await provider.send({
      channel: 'sms',
      to: '+15550001111',
      from: '+15559998888',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result.status).toBe('failed');
    expect(mockTwilioFactory).not.toHaveBeenCalled();
  });

  it('fails when no sender number is configured for the channel', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    process.env.TWILIO_AUTH_TOKEN = 'auth-token';

    const provider = new TwilioNotificationProvider();
    const result = await provider.send({
      channel: 'sms',
      to: '+15550001111',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result.status).toBe('failed');
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it('sends a plain SMS using the configured sender number', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    process.env.TWILIO_AUTH_TOKEN = 'auth-token';
    mockMessagesCreate.mockResolvedValue({ sid: 'SM123' });

    const provider = new TwilioNotificationProvider();
    const result = await provider.send({
      channel: 'sms',
      to: '+15550001111',
      from: '+15559998888',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result.status).toBe('sent');
    expect(mockTwilioFactory).toHaveBeenCalledWith(
      'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'auth-token',
    );
    expect(mockMessagesCreate).toHaveBeenCalledWith({
      from: '+15559998888',
      to: '+15550001111',
      body: 'Your membership expires soon.',
    });
  });

  it('prefixes both numbers with whatsapp: for WhatsApp messages', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    process.env.TWILIO_AUTH_TOKEN = 'auth-token';
    mockMessagesCreate.mockResolvedValue({ sid: 'SM123' });

    const provider = new TwilioNotificationProvider();
    await provider.send({
      channel: 'whatsapp',
      to: '+15550001111',
      from: '+15559998888',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(mockMessagesCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+15559998888',
      to: 'whatsapp:+15550001111',
      body: 'Your membership expires soon.',
    });
  });

  it('returns a failed result when the Twilio API call rejects', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    process.env.TWILIO_AUTH_TOKEN = 'auth-token';
    mockMessagesCreate.mockRejectedValue(
      new Error('Twilio rejected the request'),
    );

    const provider = new TwilioNotificationProvider();
    const result = await provider.send({
      channel: 'sms',
      to: '+15550001111',
      from: '+15559998888',
      subject: 'Membership expiring',
      body: 'Your membership expires soon.',
    });

    expect(result).toEqual({
      status: 'failed',
      error: 'Twilio rejected the request',
    });
  });
});
