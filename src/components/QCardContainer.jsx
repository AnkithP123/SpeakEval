"use client";

import { useState } from "react";
import QuestionCard from "./QCard";
import Card from "./Card";

export default function QuestionCardContainer() {
  const [cards, setCards] = useState([
    { id: 1, question: "", grade: "", justification: "", audioBlob: null },
  ]);

  const addCard = () => {
    const newId =
      cards.length > 0 ? Math.max(...cards.map((card) => card.id)) + 1 : 1;
    setCards([
      ...cards,
      {
        id: newId,
        question: "",
        grade: "",
        justification: "",
        audioBlob: null,
      },
    ]);
  };

  const updateCard = (id, data) => {
    setCards(
      cards.map((card) => (card.id === id ? { ...card, ...data } : card))
    );
  };

  return (
    <Card color="cyan" className="mb-8">
      <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-black/20">
        {cards.map((card) => (
          <QuestionCard
            key={card.id}
            id={card.id}
            data={card}
            updateCard={updateCard}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={addCard}
          className="bg-gradient-to-r from-purple-500 to-purple-700 text-white py-2 px-6 rounded-md font-bold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 flex items-center"
        >
          Add Card
        </button>
      </div>
    </Card>
  );
}
