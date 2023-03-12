import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import IllustrationFactory from 'Database/factories/IllustrationFactory'
import PlaceFactory from 'Database/factories/PlaceFactory'
import TagFactory from 'Database/factories/TagFactory'

export default class extends BaseSeeder {
  public async run () {
    const user = User.create({email: 'test@test.com', password: 'Test1234'})
    const illustrations = await IllustrationFactory.createMany(5)
    const places = await PlaceFactory.makeMany(3)
    const tags = await TagFactory.createMany(10)

    // first; user 1; all tags; third place
    await illustrations[0].related('places').save(places[2])
    const allTags = tags.map(tag => tag.id);
    // console.log(tags)
    await illustrations[0].related('tags').attach(allTags)

    // second; user 1; first 3 tags; second place
    await illustrations[1].related('tags').attach([tags[0].id, tags[1].id, tags[2].id])
    await illustrations[1].related('places').save(places[1])

    // third; user 2; next 3 tags; first place
    await illustrations[2].related('tags').attach([tags[3].id, tags[4].id, tags[5].id])
    await illustrations[2].related('places').save(places[0])

    // fourth; user 2; next 3 tags; third place
    await illustrations[3].related('tags').attach([tags[6].id, tags[7].id, tags[8].id])
    await illustrations[3].related('places').save(places[2])

    // fifth; user 3; last tag; first place
    await illustrations[4].related('tags').attach([tags[9].id])
    await illustrations[4].related('places').save(places[0])
  }
}
