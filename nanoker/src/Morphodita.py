from ufal.morphodita import Tagger, Forms, TaggedLemmas, TokenRanges

class Morphodita(object):
    """
    A wrapper class for stuff needed fro working with Moprhodita.
    """
    def __init__(self, model_file):
        """
        Instantiates Morphodita from a provided model file.

        :param model_file: Path to the model file,
        :type model_file: str
        """
        self.tagger = Tagger.load(model_file)
        self.forms = Forms()
        self.lemmas = TaggedLemmas()
        self.tokens = TokenRanges()
        self.tokenizer = self.tagger.newTokenizer()

    def normalize(self, text):
        """
        Returns lematized nouns and adjectives from a provided text.

        :param text: Text to be processed
        :type text: str
        """
        self.tokenizer.setText(text)
        lemmas = []
        while self.tokenizer.nextSentence(self.forms, self.tokens):
            self.tagger.tag(self.forms, self.lemmas, 1)
            for i in range(len(self.lemmas)):
                lemma, tag = self.lemmas[i].lemma, self.lemmas[i].tag
                if tag.startswith("N") or tag.startswith("A"):
                    lemmas.append([self.tagger.getMorpho().rawLemma(lemma), self.forms[i]])

        return lemmas, len(self.lemmas)