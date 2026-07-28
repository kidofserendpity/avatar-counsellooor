import sys
import asyncio
import edge_tts

VOICE = "en-US-AriaNeural"  # natural-sounding US English voice

async def generate(text, output_path):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)

if __name__ == "__main__":
    text = sys.argv[1]
    output_path = sys.argv[2]
    asyncio.run(generate(text, output_path))
    print(f"Saved to {output_path}")