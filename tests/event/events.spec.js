// Imports the configured Playwright test fixture.
import { test } from '../../src/fixtures/test.js';

// Runs the complete event, guest, and payment workflow.
test('My Events → create look, event, guest and payment', async ({
  // Provides the My Events page object.
  eventsPage,
  // Provides the Suit Builder page object.
  suitBuilderPage,
}) => {
 
  test.setTimeout(420000);

  // Opens My Events through the account navigation.
  await eventsPage.gotoFromHeader();

  // Creates a new event and keeps its generated name for later lookup.
  const eventName = await eventsPage.createEvent();
  // Switches to the user's saved looks section.
  await eventsPage.openMyLooks();
  // Creates and saves a look for the event (paused - using session looks).
  await eventsPage.createLook(suitBuilderPage);

  // Switches back to the Events tab to find the event card.
  await eventsPage.eventsTab().click();

  // Finds the event card by the generated event name.
  const eventCard = eventsPage.eventCard(eventName);
  // Expands the event card so attendee controls are available.
  await eventsPage.expandEvent(eventCard);

  // Finds the event owner's attendee card.
  const ownerCard = eventsPage.ownerCard(eventCard);
  // Chooses a random role and look for the owner from saved session looks.
  const { role, look } = await eventsPage.assignRandomRoleAndLook(ownerCard);
  // Writes the selected values into the Playwright report output.
  console.log(`Assigned role "${role}" and look "${look}"`);

  // Completes sizing only when the owner still needs measurements.
  await eventsPage.getSizedIfNeeded(ownerCard, suitBuilderPage);
  // Adds the owner's look to the cart and proceeds to checkout.
  await eventsPage.addToCartAndCheckout(ownerCard);

  // Returns to My Events after checkout.
  await eventsPage.reload();
  // Expands the event card again after the reload.
  await eventsPage.expandEvent(eventCard);
  // Creates a guest using a unique Mailosaur email address.
  const guestEmail = await eventsPage.addGuest(eventCard);
  // Writes the generated guest email into the Playwright report output.
  console.log(`Invited guest ${guestEmail}`);

  // Finds the newly created guest attendee card.
  const guestCard = eventsPage.guestCard(eventCard);
  // Sends the event invitation to the guest.
  await eventsPage.sendInvite(guestCard);
  // Completes payment for the guest's look.
  await eventsPage.completePayment(guestCard);
});
