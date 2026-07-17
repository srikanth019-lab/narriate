import json

from app import app, db, Emoji

with app.app_context():
    # Read emoji.json
    with open("emoji.json", "r", encoding="utf-8") as f:
        emojis = json.load(f)

    count = 0

    for item in emojis:
        # Get keywords/tags
        keywords = ", ".join(item.get("tags", []))

        # Skip if emoji already exists
        exists = Emoji.query.filter_by(emoji=item["emoji"]).first()
        if exists:
            continue

        new_emoji = Emoji(
            emoji=item["emoji"],
            name=item["description"],
            category=item.get("category", ""),
            keywords=keywords
        )

        db.session.add(new_emoji)
        count += 1

    db.session.commit()

    print(f"Imported {count} emojis successfully!")