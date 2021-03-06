# Speaker Windows

A complete rewrite of [Speaker-Illustrations](https://github.com/andrewwippler/speaker-illustrations).

Speaker Windows is a personal, searchable repository of illustrations which are categorized by tags. This is a replacement to paper, word doc folder, and evernote/onenote notebook filing systems.

The project aims to have an testable API which allows the use of multiuser authentication, sharing of illustrations, and browser extension to easily add illustrations.

## Upgrading

1. Clone this repository
2. Place .sql backup inside `./tmp/seeds`
3. `docker-compose up`
4. `docker-compose exec api bash`
5. `adonis migration:run`

TODO: Update user password

## Project Timeline

Version 0.1.0

- Imported schema from Speaker-Illustrations
- Migration guide
- CI/CD (GitHub Actions?)

Version 0.2.0

- API tests
- Set up models and controllers

Version 0.3.0

- Multiuser Auth

Version 0.4.0

- Basic UI
- User Preferences

Version 0.5.0

- Image uploads
- Sharing roles (Owner, Creator, Editor, Read-Only)
- Sharing ID

Version 0.6.0

- Browser Extension

Version 1.0

- Bug fixes

## License

Apache 2.0
