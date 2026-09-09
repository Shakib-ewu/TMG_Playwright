import { test } from '../../src/fixtures/test.js';

/**
 * Full owner-and-guest journey:
 * create event → assign a look → get sized → checkout → invite a guest → pay.
 */
test('My Events → create event, assign look, add guest and pay', async ({
  eventsPage,
  suitBuilderPage,
}) => {
  test.setTimeout(420000);

  await eventsPage.gotoFromHeader();

  const eventName = await eventsPage.createEvent();
  // Looks come from the saved session, so this only confirms the tab loads.
  await eventsPage.openMyLooks();
  await eventsPage.eventsTab().click();

  const eventCard = eventsPage.eventCard(eventName);
  await eventsPage.expandEvent(eventCard);

  // --- Owner: assign, size, and buy ---
  const ownerCard = eventsPage.ownerCard(eventCard);
  const { role, look } = await eventsPage.assignRandomRoleAndLook(ownerCard);
  console.log(`Assigned role "${role}" and look "${look}"`);

  await eventsPage.getSizedIfNeeded(ownerCard, suitBuilderPage);
  await eventsPage.addToCartAndCheckout(ownerCard);

  // --- Guest: invite and pay ---
  await eventsPage.reload();
  await eventsPage.expandEvent(eventCard);

  const guestEmail = await eventsPage.addGuest(eventCard);
  console.log(`Invited guest ${guestEmail}`);

  const guestCard = eventsPage.guestCard(eventCard);
  await eventsPage.sendInvite(guestCard);
  await eventsPage.completePayment(guestCard);
});
