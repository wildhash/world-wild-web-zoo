# Contributing to World Wild Web Zoo 🎪

Thank you for your interest in contributing! This project is meant to be fun, creative, and experimental. All contributions are welcome!

## Ways to Contribute

### 1. Create New Creatures 🦁

The best way to contribute is by adding new creature personalities! Each creature should have:
- A unique name and emoji
- A specialty/theme
- A creative system prompt for the AI
- A fun description

Example:
```javascript
{
  name: 'Quantum the Time Cat',
  emoji: '🐱',
  specialty: 'temporal',
  description: 'Sees websites through the lens of time and space',
  systemPrompt: 'You are Quantum, a cat who exists in all timelines simultaneously. When you visit a website, you explain it by comparing it to its past, present, and potential futures. Be mystical and philosophical.'
}
```

### 2. Improve the Interface 🎨

- Add animations
- Improve mobile responsiveness
- Create creature avatars
- Add sound effects
- Enhance visual feedback

### 3. Add Features ⚡

Ideas for new features:
- Comparison mode (multiple creatures analyzing the same URL)
- Creature memory/evolution
- Export conversations
- Share creature encounters
- Screenshot/capture mode
- Voice narration

### 4. Fix Bugs 🐛

If you find a bug, please:
1. Check if it's already reported in Issues
2. Create a new issue with reproduction steps
3. Submit a PR with a fix if you can

### 5. Improve Documentation 📚

- Fix typos
- Add examples
- Improve setup instructions
- Create tutorials

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Follow SETUP.md to configure KV and Workers AI
5. Run locally: `npm run dev`
6. Make your changes
7. Test thoroughly
8. Submit a PR

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Keep functions focused and small
- Maintain the playful, creative tone
- Write code that's easy to understand

## Pull Request Process

1. Update documentation if needed
2. Test your changes locally
3. Describe what your PR does
4. Link any related issues
5. Be open to feedback

## Adding a New Creature - Step by Step

1. Open `src/agent.ts`
2. Find the `CREATURE_PERSONALITIES` array
3. Add your new creature object
4. Test it locally
5. Update EXAMPLES.md with example output
6. Submit PR

## Ideas for Creative Creatures

Need inspiration? Try these:
- **Byte the Cyber Dragon**: Explains websites like epic dragon lore
- **Pixel the Digital Painter**: Describes sites as works of art
- **Echo the Time Traveler**: Compares modern sites to historical eras
- **Jazz the Improviser**: Explains everything as jazz improvisation
- **Code the Detective**: Investigates websites like mysteries
- **Zen the Minimalist**: Reduces everything to essential concepts
- **Cosmic the Space Whale**: Sees websites as galaxies and constellations

## Testing Guidelines

Before submitting a PR:
- Test with at least 3 different URLs
- Verify chat functionality works
- Check that KV storage is working
- Ensure no console errors
- Test on mobile if changing UI

## Questions?

Open an issue or discussion! This is a friendly, experimental project. There are no silly questions.

## Code of Conduct

- Be kind and respectful
- Embrace creativity and experimentation
- Help others learn
- Have fun! 🎉

## Recognition

Contributors will be added to the README! Every contribution, big or small, is appreciated.

---

Remember: This project is about creativity, humor, and making AI fun. Don't overthink it - just have fun! ✨
