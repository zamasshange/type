"use client";

export function AboutView() {
  return (
    <div className="page-panel about">
      <header className="page-head">
        <h1>about</h1>
        <p>a world arena for people who type like it matters</p>
      </header>
      <p>
        Typehaven keeps the quiet, caret-first test that made{" "}
        <a href="https://monkeytype.com/" target="_blank" rel="noreferrer">
          monkeytype
        </a>{" "}
        great — then it becomes something else. You type for a country. Your result hits a
        real server. National, continental, and world boards move. That is the product.
      </p>
      <h2>what monkeytype does not do here</h2>
      <ul className="feature-list">
        <li>real flags and a country you represent</li>
        <li>Cloud Firestore — live world scores in your typesite project</li>
        <li>Nations Cup — countries ranked by their top 5 on time 60</li>
        <li>continental standings and a world tape of recent scores</li>
        <li>rating that rises and falls when you finish a ranked test</li>
        <li>pace caret that can chase your nation&apos;s #1, not just your own PB</li>
        <li>results that show world / continent / country rank immediately</li>
      </ul>
      <h2>ranked modes</h2>
      <p>time 15 / 30 / 60 / 120, words 10 / 25 / 50 / 100, and the daily cup.</p>
      <h2>shortcuts</h2>
      <ul className="feature-list">
        <li>tab — restart</li>
        <li>esc — command line</li>
        <li>ctrl/cmd + backspace — clear the current word</li>
      </ul>
    </div>
  );
}
