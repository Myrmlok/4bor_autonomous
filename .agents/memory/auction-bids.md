---
name: Auction bids overlay
description: Decision — catalog lots stay static while auction state persists in DB
---
Decision: the lot catalog remains static data for now; auction state (bids, sales) persists in the database and is overlaid onto API lot responses.
**Why:** migrating the whole catalog to the DB is a separate planned task; the overlay lets bidding be real without that migration.
**How to apply:** keep the overlay until lots move to the DB; bid writes must be serialized per lot (advisory lock in a transaction) so concurrent blitz bids can't both "win". Auctions have no end time — only a blitz bid closes a lot.
