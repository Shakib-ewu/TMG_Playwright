import { test, expect } from '../../src/fixtures/test.js';

/**
 * Full owner-and-guest journey:
 * create event → assign a look → get sized → checkout → invite a guest →
 * guest sees the invitation → pay.
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

  const { guestEmail, role: guestRole, look: guestLook } = await test.step(
    'Guest: invite by email',
    async () => {
      const invited = await eventsPage.addGuest(eventCard);
      console.log(`Invited guest ${invited.guestEmail} as "${invited.role}" / "${invited.look}"`);
      return invited;
    }
  );

  const guestCard = eventsPage.guestCard(eventCard);

  await test.step('Guest: send the invite', async () => {
    await eventsPage.sendInvite(guestCard);
  });

  await test.step('Guest: signs in and sees the invitation', async () => {
    // A real sign-in as the guest, in its own browser context — not the owner's
    // browser acting on the guest's behalf, which is what every other guest
    // step here does. This is the one check that confirms the invitation is
    // actually visible from the guest's own account.
    const guestEventsPage = await eventsPage.viewInvitationsAsGuest(guestEmail);

    try {
      // The card renders the role in upper case via CSS, so the label is
      // matched case-insensitively rather than assuming a particular case.
      const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(guestEventsPage.page.getByText(eventName)).toBeVisible();
      await expect(
        guestEventsPage.page.getByText(new RegExp(`Role:\\s*${escape(guestRole)}`, 'i'))
      ).toBeVisible();
      await expect(
        guestEventsPage.page.getByText(new RegExp(`Look:\\s*${escape(guestLook)}`, 'i'))
      ).toBeVisible();
      await expect(guestEventsPage.getSizedFromInvitationButton()).toBeVisible();
    } finally {
      await guestEventsPage.page.context().close();
    }
  });

  await test.step('Guest: complete payment and reach checkout', async () => {
    await eventsPage.completePayment(guestCard);
  });
});
