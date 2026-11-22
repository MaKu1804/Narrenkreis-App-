import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePollResults,
  calculatePostRating,
  calculateExcursionCapacity,
  groupAttendeesByClub,
  validateClubRegistration,
  filterEventsForCalendar,
  isPraesidiumMember,
  validateProfile,
  resolveRecipients,
  getEmailsForUser,
  clearMailboxForUser,
  deleteSingleEmail,
  type Poll,
  type Excursion,
  type UserProfile,
  type Club,
  type SentEmail
} from './clubLogic.ts';

test('isPraesidiumMember correctly identifies executive roles in Narrenkreis', () => {
  const president: UserProfile = {
    id: 'u-1',
    name: 'Bernd Heitlinger',
    email: 'praesident@narrenkreis-bruchsal.de',
    mobile: '0171 1234567',
    clubId: 'club-gkg',
    positionInClub: 'Ehrensenator',
    praesidiumRole: 'Narrenkreis Präsident',
    avatar: 'BH',
    joinedDate: '2015-01-01'
  };

  const vize: UserProfile = {
    ...president,
    praesidiumRole: 'Narrenkreis Vizepräsident'
  };

  const standardUser: UserProfile = {
    ...president,
    praesidiumRole: null
  };

  assert.equal(isPraesidiumMember(president), true);
  assert.equal(isPraesidiumMember(vize), true);
  assert.equal(isPraesidiumMember(standardUser), false);
  assert.equal(isPraesidiumMember(null), false);
});

test('validateProfile enforces mandatory fields (Name, Email, Mobile, Club, Position) and allows optional Address/Phone', () => {
  // Valid profile with mandatory fields filled and optional fields empty
  const validProfile: Partial<UserProfile> = {
    name: 'Stefan Meyer',
    email: 'stefan@carneval.de',
    mobile: '+49 176 1234567',
    clubId: 'club-heidelsheim',
    positionInClub: 'Elferrat'
  };

  const check1 = validateProfile(validProfile);
  assert.equal(check1.valid, true);
  assert.equal(check1.errors.length, 0);

  // Missing mobile and position
  const invalidProfile: Partial<UserProfile> = {
    name: 'Stefan Meyer',
    email: 'stefan@carneval.de',
    mobile: '',
    clubId: 'club-heidelsheim',
    positionInClub: ''
  };

  const check2 = validateProfile(invalidProfile);
  assert.equal(check2.valid, false);
  assert.equal(check2.errors.length, 2);
  assert.match(check2.errors[0], /Handynummer/);
  assert.match(check2.errors[1], /Position/);
});

test('resolveRecipients handles single person, club, and all members', () => {
  const users: UserProfile[] = [
    {
      id: 'u1',
      name: 'User 1',
      email: 'u1@narren.de',
      mobile: '123',
      clubId: 'c1',
      positionInClub: 'Zunftmeister',
      avatar: 'U1',
      joinedDate: '2020-01-01'
    },
    {
      id: 'u2',
      name: 'User 2',
      email: 'u2@narren.de',
      mobile: '456',
      clubId: 'c1',
      positionInClub: 'Gardetänzerin',
      avatar: 'U2',
      joinedDate: '2021-01-01'
    },
    {
      id: 'u3',
      name: 'User 3',
      email: 'u3@andere.de',
      mobile: '789',
      clubId: 'c2',
      positionInClub: 'Kassier',
      avatar: 'U3',
      joinedDate: '2022-01-01'
    }
  ];

  const clubs: Club[] = [
    {
      id: 'c1',
      name: 'Bruchsaler Narrenzunft',
      shortName: 'BNZ',
      category: 'Narrenzunft',
      logo: '',
      color: '#ff0000',
      description: '',
      memberCount: 100,
      establishedYear: 1980
    }
  ];

  // All
  const allRes = resolveRecipients('all', undefined, users, clubs);
  assert.equal(allRes.count, 3);
  assert.equal(allRes.emails.length, 3);

  // Club c1
  const clubRes = resolveRecipients('club', 'c1', users, clubs);
  assert.equal(clubRes.count, 2);
  assert.deepEqual(clubRes.emails, ['u1@narren.de', 'u2@narren.de']);

  // Single person u3
  const personRes = resolveRecipients('person', 'u3', users, clubs);
  assert.equal(personRes.count, 1);
  assert.equal(personRes.emails[0], 'u3@andere.de');
});

test('calculatePollResults correctly computes total and percentages', () => {
  const mockPoll: Poll = {
    question: 'Welches Fastnachtsmotto 2027?',
    options: [
      { id: 'opt-1', text: 'Bruchsal feiert bunt', votes: ['user-1', 'user-2', 'user-3'] },
      { id: 'opt-2', text: 'Barock & Narrenkapp', votes: ['user-4'] }
    ]
  };

  const result = calculatePollResults(mockPoll);
  assert.equal(result.totalVotes, 4);
  assert.equal(result.options[0].percentage, 75);
  assert.equal(result.options[1].percentage, 25);
});

test('mailbox isolation and clearing per profile', () => {
  const emails: SentEmail[] = [
    {
      id: 'm1',
      senderUserId: 'user-bernd',
      fromName: 'Bernd',
      fromEmail: 'bernd@bruchsal.de',
      recipientType: 'all',
      recipientDisplay: 'An alle',
      recipientEmails: ['bernd@bruchsal.de', 'susanne@bruchsal.de'],
      subject: 'Hauptversammlung',
      body: 'Hallo alle',
      sentAt: '2026-10-18T10:00:00Z'
    },
    {
      id: 'm2',
      senderUserId: 'user-susanne',
      fromName: 'Susanne',
      fromEmail: 'susanne@bruchsal.de',
      recipientType: 'person',
      targetId: 'user-bernd',
      recipientDisplay: 'Bernd Heitlinger',
      recipientEmails: ['bernd@bruchsal.de'],
      subject: 'Protokoll',
      body: 'Hier ist das Protokoll',
      sentAt: '2026-10-19T11:00:00Z'
    }
  ];

  // Bernd's sent box contains only m1
  const berndSent = getEmailsForUser('user-bernd', 'bernd@bruchsal.de', 'club-gkg', emails, 'sent');
  assert.equal(berndSent.length, 1);
  assert.equal(berndSent[0].id, 'm1');

  // Susanne's sent box contains only m2
  const susanneSent = getEmailsForUser('user-susanne', 'susanne@bruchsal.de', 'club-bnz', emails, 'sent');
  assert.equal(susanneSent.length, 1);
  assert.equal(susanneSent[0].id, 'm2');

  // Bernd empties his postbox (clears only his emails)
  const afterBerndClear = clearMailboxForUser('user-bernd', 'bernd@bruchsal.de', emails, 'sent');
  assert.equal(afterBerndClear.length, 1);
  assert.equal(afterBerndClear[0].id, 'm2'); // Susanne's email is still intact!

  // Susanne's postbox is still full
  const susanneStillHasEmails = getEmailsForUser('user-susanne', 'susanne@bruchsal.de', 'club-bnz', afterBerndClear, 'sent');
  assert.equal(susanneStillHasEmails.length, 1);

  // Deleting single email
  const afterSingleDelete = deleteSingleEmail('m2', afterBerndClear);
  assert.equal(afterSingleDelete.length, 0);
});
