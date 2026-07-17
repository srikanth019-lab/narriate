import json
from app import app, db, Emoji

with app.app_context():
    # Read emoji.json
    with open("emoji.json", "r", encoding="utf-8") as f:
        emojis = json.load(f)

    count = 0

    for item in emojis:
        db.session.add(
            Emoji(
                emoji=item["emoji"],
                name=item["description"],
                category=item.get("category", ""),
                keywords=", ".join(item.get("tags", []))
            )
        )
        count += 1

    db.session.commit()

    print(f"Imported {count} emojis successfully!")