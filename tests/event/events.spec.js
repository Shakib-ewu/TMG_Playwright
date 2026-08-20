import { test } from '../../src/fixtures/test.js';

test('My Events → create look, event, guest and payment', async ({
  eventsPage,
  suitBuilderPage,
}) => {
  // slowMo adds ~1s per action and this flow is long, so the budget has to be generous
  test.setTimeout(420000);

  await eventsPage.gotoFromHeader();

  // Scene 1 — build a look
  await eventsPage.openMyLooks();
  await eventsPage.createLook(suitBuilderPage);

  // Scene 2 — create the event and stay scoped to it from here on
  const eventName = await eventsPage.createEvent();
  const eventCard = eventsPage.eventCard(eventName);
  await eventsPage.expandEvent(eventCard);

  // Scene 3 — assign a random role and look to myself
  const ownerCard = eventsPage.ownerCard(eventCard);
  const { role, look } = await eventsPage.assignRandomRoleAndLook(ownerCard);
  console.log(`Assigned role "${role}" and look "${look}"`);

  // Scene 4 — get sized, then buy my own look
  await eventsPage.getSizedIfNeeded(ownerCard, suitBuilderPage);
  await eventsPage.addToCartAndCheckout(ownerCard);

  // Scene 5 — invite a guest
  await eventsPage.reload();
  await eventsPage.expandEvent(eventCard);
  const guestEmail = await eventsPage.addGuest(eventCard);
  console.log(`Invited guest ${guestEmail}`);

  // Scene 6 — send the invite, then pay for the guest
  const guestCard = eventsPage.guestCard(eventCard);
  await eventsPage.sendInvite(guestCard);
  await eventsPage.completePayment(guestCard);
});
