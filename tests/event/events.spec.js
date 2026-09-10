import { test } from '../../src/fixtures/test.js';

/**
 * Full owner-and-guest journey:
 * create event → assign a look → get sized → checkout → invite a guest → pay.
 *
 * Each phase is a test.step so a failure names the stage it happened in rather
 * than only pointing at a line deep inside the page object.
 */
test('My Events → create event, assign look, add guest and pay', async ({
  eventsPage,
  suitBuilderPage,
}) => {
  // Measured at roughly a minute end to end with slowMo on; the wide budget is
  // headroom for a slow checkout, not the expected runtime.
  test.setTimeout(420000);

  await test.step('Open My Events', async () => {
    await eventsPage.gotoFromHeader();
  });

  await test.step('Make sure the account has a look to assign', async () => {
    // A session rebuilt after its 24-hour life starts as a brand-new customer
    // with no looks, and the attendee dropdowns need at least one.
    const created = await eventsPage.ensureLookExists(suitBuilderPage);
    console.log(created ? `Created look "${created}"` : 'Account already has looks');
  });

  const eventName = await test.step('Create an event', async () => {
    return eventsPage.createEvent();
  });

  const eventCard = eventsPage.eventCard(eventName);

  await test.step('Expand the event card', async () => {
    await eventsPage.expandEvent(eventCard);
  });

  // --- Owner: assign, size, and buy ---
  const ownerCard = eventsPage.ownerCard(eventCard);

  await test.step('Owner: assign a random role and look', async () => {
    const { role, look } = await eventsPage.assignRandomRoleAndLook(ownerCard);
    console.log(`Assigned role "${role}" and look "${look}"`);
  });

  await test.step('Owner: complete sizing', async () => {
    await eventsPage.getSizedIfNeeded(ownerCard, suitBuilderPage);
  });

  await test.step('Owner: add to cart and reach checkout', async () => {
    await eventsPage.addToCartAndCheckout(ownerCard);
  });

  // --- Guest: invite and pay ---
  await test.step('Return to My Events', async () => {
    await eventsPage.reload();
    await eventsPage.expandEvent(eventCard);
  });

  await test.step('Guest: invite by email', async () => {
    const guestEmail = await eventsPage.addGuest(eventCard);
    console.log(`Invited guest ${guestEmail}`);
  });

  const guestCard = eventsPage.guestCard(eventCard);

  await test.step('Guest: send the invite', async () => {
    await eventsPage.sendInvite(guestCard);
  });

  await test.step('Guest: complete payment and reach checkout', async () => {
    await eventsPage.completePayment(guestCard);
  });
});
