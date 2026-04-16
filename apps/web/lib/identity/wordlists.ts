/**
 * Word lists for anonymous handles. Adjectives lean descriptive/textural so
 * they read well with any noun; nouns are curated music vocabulary so the
 * resulting handle always *feels* music-flavored (vs Reddit's generic list).
 *
 * Collisions are cosmetically harmless — uniqueness lives on `identity_id`,
 * not the handle. 200 x 300 x 900 = 54M combos.
 */

export const adjectives: readonly string[] = [
  'Velvet', 'Neon', 'Fuzzy', 'Lush', 'Smoky', 'Gritty', 'Warm', 'Acid', 'Dusty', 'Amber',
  'Midnight', 'Foggy', 'Glassy', 'Molten', 'Crimson', 'Cobalt', 'Electric', 'Opal', 'Static', 'Ragged',
  'Silken', 'Brass', 'Frosted', 'Solar', 'Hazy', 'Languid', 'Tidal', 'Jagged', 'Slick', 'Astral',
  'Bitter', 'Blue', 'Broken', 'Bronze', 'Burnt', 'Cold', 'Crystal', 'Dim', 'Distant', 'Drowsy',
  'Dreamy', 'Dusky', 'Ember', 'Empty', 'Faded', 'Feral', 'Fragile', 'Golden', 'Grainy', 'Green',
  'Hollow', 'Hungry', 'Iced', 'Ivory', 'Lavender', 'Lazy', 'Liquid', 'Lonely', 'Long', 'Loose',
  'Loud', 'Low', 'Mellow', 'Milky', 'Minor', 'Misty', 'Muted', 'Narrow', 'Numb', 'Oceanic',
  'Open', 'Outer', 'Painted', 'Paper', 'Patient', 'Pearl', 'Plastic', 'Plush', 'Quiet', 'Radiant',
  'Rainy', 'Raw', 'Restless', 'Rising', 'Rose', 'Rough', 'Ruby', 'Rustic', 'Saffron', 'Salty',
  'Sapphire', 'Sated', 'Scarlet', 'Scattered', 'Secret', 'Sepia', 'Serene', 'Shallow', 'Sharp', 'Shining',
  'Silver', 'Sleeping', 'Slim', 'Slow', 'Small', 'Smooth', 'Soft', 'Solemn', 'Spare', 'Sparse',
  'Splintered', 'Stained', 'Stark', 'Steady', 'Still', 'Storm', 'Strange', 'Striped', 'Stubborn', 'Sudden',
  'Sunken', 'Sunset', 'Supple', 'Tangled', 'Tender', 'Tidal', 'Tin', 'Tipsy', 'Torn', 'Translucent',
  'Tropical', 'Tumbled', 'Twilight', 'Unlit', 'Upward', 'Urban', 'Vacant', 'Vague', 'Valiant', 'Vaporous',
  'Verdant', 'Vernal', 'Vintage', 'Violet', 'Wandering', 'Waxen', 'Weary', 'Weathered', 'Whispering', 'Wide',
  'Wild', 'Wilted', 'Winding', 'Windswept', 'Winter', 'Wistful', 'Woven', 'Yellow', 'Young', 'Zesty',
  'Analog', 'Baroque', 'Brittle', 'Candid', 'Celestial', 'Chrome', 'Cinematic', 'Curious', 'Dapper', 'Deep',
  'Detuned', 'Diffuse', 'Distant', 'Dubbed', 'Echoing', 'Feathered', 'Feverish', 'Flickering', 'Folded', 'Frayed',
  'Freckled', 'Fresh', 'Fretted', 'Gentle', 'Gleaming', 'Graceful', 'Halcyon', 'Hammered', 'Heavy', 'Honeyed',
  'Hushed', 'Illuminated', 'Inky', 'Kindled', 'Languorous', 'Levitating', 'Lilac', 'Lustrous', 'Marbled', 'Mercurial',
] as const;

export const musicNouns: readonly string[] = [
  'Reverb', 'Delay', 'Cadence', 'Arpeggio', 'Crescendo', 'Bassline', 'Echo', 'Tremolo', 'Vibrato', 'Ostinato',
  'Overtone', 'Harmonic', 'Rhythm', 'Tempo', 'Motif', 'Refrain', 'Chorus', 'Verse', 'Bridge', 'Hook',
  'Riff', 'Groove', 'Swing', 'Fugue', 'Etude', 'Prelude', 'Sonata', 'Nocturne', 'Waltz', 'March',
  'Interlude', 'Coda', 'Glissando', 'Staccato', 'Legato', 'Fermata', 'Dissonance', 'Consonance', 'Tonic', 'Dominant',
  'Timbre', 'Dynamics', 'Ambience', 'Resonance', 'Modulation', 'Distortion', 'Feedback', 'Flanger', 'Phaser', 'Chorus',
  'Synth', 'Sampler', 'Sequencer', 'Mixer', 'Fader', 'Knob', 'Patch', 'Preset', 'Sample', 'Loop',
  'Kick', 'Snare', 'Hat', 'Cymbal', 'Tom', 'Conga', 'Bongo', 'Tambourine', 'Triangle', 'Shaker',
  'Bass', 'Treble', 'Mid', 'Octave', 'Fifth', 'Third', 'Fourth', 'Seventh', 'Ninth', 'Root',
  'Sharp', 'Flat', 'Natural', 'Key', 'Chord', 'Scale', 'Mode', 'Lydian', 'Dorian', 'Mixolydian',
  'Blues', 'Jazz', 'Funk', 'Soul', 'Disco', 'Techno', 'House', 'Ambient', 'Dub', 'Ska',
  'Raga', 'Drone', 'Bellows', 'Pipe', 'Reed', 'Hammer', 'String', 'Bow', 'Fret', 'Pedal',
  'Pluck', 'Strum', 'Finger', 'Thumb', 'Palm', 'Bend', 'Slide', 'Hammer-on', 'Pull-off', 'Trill',
  'Album', 'Single', 'Track', 'Suite', 'Concerto', 'Symphony', 'Anthem', 'Hymn', 'Ballad', 'Lullaby',
  'Ditty', 'Jingle', 'Melody', 'Tune', 'Aria', 'Cantata', 'Madrigal', 'Motet', 'Psalm', 'Chant',
  'Solo', 'Duet', 'Trio', 'Quartet', 'Quintet', 'Sextet', 'Septet', 'Octet', 'Ensemble', 'Choir',
  'Pianist', 'Guitarist', 'Bassist', 'Drummer', 'Singer', 'Conductor', 'Composer', 'Arranger', 'Producer', 'DJ',
  'Vinyl', 'Cassette', 'Record', 'Needle', 'Stylus', 'Turntable', 'Platter', 'Groove', 'Sleeve', 'Label',
  'Concert', 'Gig', 'Set', 'Session', 'Jam', 'Rehearsal', 'Tour', 'Encore', 'Festival', 'Matinee',
  'Piano', 'Organ', 'Harp', 'Violin', 'Cello', 'Flute', 'Oboe', 'Clarinet', 'Trumpet', 'Trombone',
  'Horn', 'Tuba', 'Sax', 'Fiddle', 'Banjo', 'Ukulele', 'Mandolin', 'Sitar', 'Koto', 'Kalimba',
  'Marimba', 'Xylophone', 'Vibraphone', 'Glockenspiel', 'Celesta', 'Theremin', 'Accordion', 'Harmonica', 'Bagpipe', 'Didgeridoo',
  'Tambura', 'Shamisen', 'Erhu', 'Pipa', 'Tabla', 'Djembe', 'Kora', 'Balalaika', 'Zither', 'Dulcimer',
  'Note', 'Rest', 'Measure', 'Bar', 'Meter', 'Time', 'Signature', 'Clef', 'Staff', 'Ledger',
  'Pitch', 'Tone', 'Scale', 'Interval', 'Accent', 'Stress', 'Phrase', 'Form', 'Texture', 'Voice',
  'Whistle', 'Hum', 'Croon', 'Warble', 'Yodel', 'Scat', 'Falsetto', 'Vocoder', 'Autotune', 'Reverse',
  'Crossfade', 'Drop', 'Buildup', 'Breakdown', 'Switch', 'Cue', 'Break', 'Sweep', 'Swell', 'Stab',
  'Cluster', 'Arpeggiator', 'Oscillator', 'Filter', 'Envelope', 'LFO', 'Attack', 'Decay', 'Sustain', 'Release',
  'Console', 'Fader', 'Channel', 'Bus', 'Insert', 'Send', 'Master', 'Compressor', 'Limiter', 'Gate',
  'Reverb', 'Chorus', 'Phaser', 'Flanger', 'Tremolo', 'Vibrato', 'Overdrive', 'Fuzz', 'Wah', 'Octaver',
  'Beat', 'Pulse', 'Throb', 'Thump', 'Boom', 'Clap', 'Snap', 'Click', 'Tick', 'Tock',
] as const;
