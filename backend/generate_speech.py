import sys
import asyncio
import edge_tts

VOICE = "en-US-JennyNeural"  # warm, conversational — less "announcer," more natural chat
RATE = "-4%"   # very slightly slower than default — reads as calmer, less clipped
PITCH = "-2Hz" # a touch lower — softens the "AI narrator" edge

async def generate(text, output_path):
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await communicate.save(output_path)

if __name__ == "__main__":
    text = sys.argv[1]
    output_path = sys.argv[2]
    asyncio.run(generate(text, output_path))
    print(f"Saved to {output_path}")