import type { StatusEffect } from './statusTypes';

export const jaegerShots: StatusEffect = {
	name: 'Jager Shots',
	description: 'Gain 10 Defense for 3 turns',
	image:
		'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCBUWFRgSFhYYGBgZGRoYGhkZGRgZHRoYHBgZGhkYGBodIS4lHB4rHxwcJjgmLS8xNTU1GiQ7QDszPy40NTEBDAwMEA8QHRISHzUrJCQ0NDQ0NDQ0NDQ0NDQ0NDQ0NjQxNDQ0NDQ0NDQ0NDQ0NDE0NDE0NDQ0MTQ0NDQ0NDE/NP/AABEIAQMAwgMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAQQCAwUGB//EAEIQAAEDAgMEBwUEBwgDAAAAAAEAAhEhMQNBUQQSYXEFEyKBkaGxMlLB0fAGFGLhIzNCU5Ki8QcVF3JzgrLCJIOT/8QAGgEBAAMBAQEAAAAAAAAAAAAAAAECBAMFBv/EACkRAQACAgAEBQQDAQAAAAAAAAABAgMRBBIhMQUiMkFRFFJhkRVxoRP/2gAMAwEAAhEDEQA/APsyIiAiIgIiru2kTugFxzAFuZsEFhFpa5xyA75WRJ4INiLQXlQXHVToWEVcuOqjeOpTQsoq28dSo3napoWkVYOOpU7x1PkmhYRV986+igPPDwTQsoq5xHDIHvI9QowdpDiWwWuAnddQxaeSgWUREBERAREQEREBERBBVXF2RpJcJa4xLmktJ0nI96tLGanuQVOoe22K4/5mtPmIWLziZFjuYcPQlWnPWsvGoQ00tfiZtZ3OcPghxH/uwf8AePiFmcRuoWPXN18kS1HaX/uv52KPvLv3R/8Aoz5rJ2M36BWHXN4+Ca/KWf3l/wC7P8bFB2l/uH+Niw69vHwUDHbx8FOo+RsbjP8A3Y73t+SzL8TJjBzeT6NWDcZvHwWf3lv0FHT5QkOxM9wfxH5KAx+bwOTfmSsuvbqn3hnvDxU7j5NNf3WfaxHnk4NH8onzVjZtmYwndaATUm5PMmpWsY7TZzfEK1hlNo02ooRQJRQiCUUIglERAREQQuH0/tGMwThYYxAR2mh+4/gWk08V3FR6QFu9cs15rSbR7LUjdoh4o9PsB/TbPtWEcy7CLx/GwmVcwOmNmNRigDR5czx3oXRxiqL2jMA9wXhX8XtSdTWP2314eJ917B6QwSOziNceD2keqsja2e+3+ILzztlZ7jfABajseH7g81WPGo+3/V/pN+70n3hurfEKHYo09F5g7Fh+4PE/NSNkZ7vm75q38xX7Z/Z9H+XpDicD5J1hvHmvO/dWe75n5oNkZ7g80/ma/bP7Povy742oZlo5uHzWl/SuC32sXCbzxGD4rkDYsP3G+C2N2Vg/YZ/CFWfG4+3/AE+jj5WHdMbMZPXYZ/yv3vRah0xs59nDxHn8OE4/zGAtrMJos0DkArOEqT41aelax+0Tw0R7ucNpxnn9FsUD38XEDB4NBK9X0KMTcPWFpdNNwENAgQBJk81Rw119hHZ716XAcVfNaeb4Zc1YrHRaREXqswiIgIiIJREQEREEKn0gKDn8FcVXbh2e9cs0bx2j8L09UOJjhUnq9jKk9fF8RXrL1sbQ5YFZuWBWWIaIYOUKSsHF0dls+StELbbFLVhgMcfagcvqy2OwHjip5JnsrN4SFmCtIY8ZO8ED3fQ/NROOyvNErLVYwlQ613BZsx3fh0sVNMdtqW6uxhLsbGOyO9eWO1OaL/yinmvT9HE9W0m8VX0/hdJjcy83iOi0iIvZZRERAREQSiIgIiIIVbbvZPd6qytWO2QVW8brMJr3eZxWOdEyATxm+i3fd6eyL0IzHGQtzzmNfo/WixLzEgzTOP6r529I5tab+adNTmCjQAPAwtTsPUA8d0W5BZYpjv8AKRmLKWtisC0XhcrY47LVlU6lpy+PfCnA2bec4RQWIJvyVrdrlMzFpWLHQSG2ubVcblZbY677L89vZUILXbp+oVtjPNZ4Gz3LrmsaVPmtbZFxQZjzSlIhM322tik6zf1Wbw3MDvC1MuYzvaAOHArY056UFcjqu9Yc5GYLHz2RzFD5LbhbHh+1BOWcTlTWVDXxlFrAmput4cBckzekiczS3JasVauN7T7NT9nbcNg5RXvhdnAaA0AWAC5TwTJDnNaRECM6kg3B4WXXYIEL2OGiIidM95me7NERanMREQEREEoiICIiAsH2KzUFRI4WIb+C1HDbEa0z1mJVl/5WzqtEjP6GUrxMlfNtsrPRpxiDQczanmsGxrK24nDw9PorCtvJZrw6VYOFbD49yzwXUMUAk2voj5045LLDJzEcOWqz2rO1txoDybDztotYmTRbhQnIR9UWvj+ffASKm0sYbAWrNKeK2Nbek+HksWsHHvWwFXhEzLJzojn4LawyaGfrP5LSWyI0rfNbwCKASbkkxXK614+7lZv3KZ2A8fiuiFzcMuzEWzzmq6IXr4PSy27pREWhUREQEREEoiICIoQSoKIUHFxT2iMp9FpDq5nw8FX6YwsUOccMb4Lpc2RIrlK54xMY+017aj3QQKXGvzXkZ+lpa6RuHWxHUPy9fFanEZEcOfzXMxW4jYkuM8qTm4i45IcZ4owExfeI8iQsNrfh1rC+7aBale0IrIBFhHkrGz44PZkSBJuI56LkP2rEv2b6fmtb8d8VdAGTRAHzK42laa7dfFx947omNYEeeqwa6beOnI5qk3anmgAJrIiRBiRCtMY01JrESTHOimNzCdabzaPStdOPJGvBjdBI5RGt/RUdtljCWje4Gzhe+q07L0oGlrXMxK0J3JAJsDuk8uMqaqzHu7GM+IiBPdXITpRY4D+0W7xOZmSRMkbwn2dJXD2jpx7y5jMBzQIIOKQzeBEAyTQTI3b8lrw+k9oc9jeq3cIVc5jmxvSRuvJqIuQMiIJstOPdZc5ruOz02yP3nthwJkmgFgIImTS3gu6F5/orFa54DQABNmhonMr0IXscPO67ZbxqdCKUWhRCKUQQilEBERAUKVCAhREHH6QxNxxdDyJE7gk2uRmKLnghznOiRO8KutSZHwOi6+20dIvHlnzXNxnHeD6HeaMyKiluULzOJrqzvTqz6sEExeD+cZSq7sFpiRzue7hdbg92nmocSHUgZxwWbUS7RKkdnBpvQTIjO6k7O0VNRznmDGa3vdWmXreiQD7Rmlqkin7Md1UilSbS1hgsBnaa/wBVD8EOMm8ROfELa4wA0Emwt4mfNVy6twRUxOfos+asdodKyqbdgRhktk988CY4LlseZmrD+EkSOY8V2ttPYtSaEAHzVDqaWMV+d1XFi5oiU2tobjEgh/bBzDjJ5tNO8LZhYbnS6KAGBPs0Eei0vEcOBNeRWTKVb4fBdPpZieaJRGSOzs/ZrDIxPaJ7J1NJpE969UvPfZqpJ4fFeiC9vh41jhiyz5koiLu5iIiAiIgIiIChSoQEREHP6QFRWKea4+1P7Y4yOVRY68V2OlXQ3eloABkuMAVFZyXL3t9gIMgGeyCQY9wrz+KjrLvjlq6wExMxXUQsnmuRMxBM+PBan4oJkEGZkQQWgUqM4MrW3agJAbcWdqcoFtYWPcQ7a23YZEkkREUtW4QbpMzexjl4lUvvJmTkIgUbFiAL3W521ml4N7C4ypeyTeNHK3hsGRbjlF+9anPFRZ3P4ZLU59pg2IBBmDFDzWLW3iJH1APCqzX69nSvRk/ElpblAcYELPCYIm61Y9A0QJJANZykQs8CY3s7rVwkdJhTJ8t2Ls7HRIE8AI71TGykEkVAMETnOXBXi86cT9d0o1g+IrHaiO9atblz7L32eZBdTILurkdCAziHiI8111uxxqsM9u6URFdUREQEREBERAUKVCAiIg5fTeOGMDjGba2kinovNu6UDtRSKCa7wJjSlaL1XSjAWEEAjMESDTNcLqGN9lrW8QIXk+IZJrMaasFYmOqribW14ktcDNDuwBSTJuFowyaEPcSLzpxMXylWHNDngkkU7Odc57vVY42EAS2DSu8KAg+t7rDitN43LvaIr0hpcHGBAIgVbY0O8CLiKaytuFhuBkEZ3BNCIqCsmMiu9SY0HHy9V0GYIyIpbjoeC20xRaHG1tOe/DIpMZd2QlYYmCSIJgHS/n9VV5+BFDxqbUWO5MAEHkaxyVpwVRF5UnsnOTYTwWeG/d7LrGpcT7IntRnVb+pJkgSAanKuVVox9kmAW7zhJgmBTicr3XKKf87bhbm5o1LZ94FRPnAGh8/NW2QMMCxmk1pryMeK4+0Nex0OiwjlOZ1E/JbXY8N3Zi5v8sl2reNomr0/Qg7Ljq74LprmdBfqwdSV016NPTDNb1SlERXVEREBERAREQFClQgIiIKfSMbhJ1HqAvP7e+GuABtfLlzXe6X/AFTzoAfAgrze0ugAVM+Q+a8nxKvaWrh5MNsRcxH5qcdm67rBDryO06JrBpZZ4OHUCn1qrT8Oh4+XyWTBSeV1vbqrYeCMogi9b93grGHjw3dI5QacSdNFlhN7IFZByzjVHYQnUiKECMzMR3r0McTEOFp6q7sLfgibVFanJpkrczZTEUFTX9oXr5WWwa2JMzIFOGl0BtYaxU2uSc4nxV0MiwtbJNZ/ZHgYOeqqbSIDIvvUdWxIFheQSrm/mJ5Rr5ZXVVju0wGM3WtFjNgaii536php2pocd3dt7UgVtE+CoO2VhMgXMwDddJxG8TJ5zY61vWVXaRvTFp0+oWDrztEel6XocDqmgZSPNXlQ6G/VNOsnzKvr3qemGC3eUoiK6BERAREQEREBQpUICIiCj0yP0GL/AKbyOYaSF5ku3msdlc62pb6ovWbY2WPbq1w8WleL6Kxw/D3ZqKd4PpOaxcZj567+HbDbUr+A8Ajwzz0KuEcfJUGMkH64jLv7lf2d+82bkUd/mF8rfmsuCvl06ZJ67MI1FNdDXipcan4EXkCmaxe4sO/ZtJ52B7xQ9ydc28isw2YiPXWi7x0UlLhX6m/FZBwzEwMpPcTy9VoOOLCvAA17yjcRxBgQDqbAxeP6qJlOmxzyaQQImlJGknLitT8TtGI7I0FXGJoeAAooOET7TibEiD3hZ0AhswK19YkpMTMHZUxTeldZPpK1F8AnmfAUWWIaxqZPzVDpXagxkT2nHdAWTFjm2To6Wtqr2vRDYwcPXcaT3iVeVfYhDGDRrf8AiFYXuMYiIgIiICIiAiIgKFKhAREQYOEiDyXzzbujn4JLsLttBduAmN1xcC5rtRExpPFfRSuBg4Rl8gEFxgXpJvxlTGpiYntI8ls/T7Cer3wx8SWPad1sk3pTOyv/AHl5IsW2BG8YBi+6Zm+Wa6O39A4eId6ADxG8DwyLe6Vzv7qdht3Ie1uTmdsD/cBvRwIKzX4SZnyS6Rm1Hmhrf0s0ULgSTVoa8m+mSl+K1wIcxoae0ScjqTMimS1vZjXY9mINPZd5WKqY+3YrfawvDejx3SFjycPnr7OlclZdTA6TAkNcxwF4IMDKDotmH0210w0mDUtrHKF5/wDveLYYHJwH/VZM6RxHezhHzjx3QFWtM3aEzanu9IzpTDsSW82n5LPG2xgbv77SIpBaOGS861+Kfaexg0A3j8lZZ0a/EbuQ4tPtOdDd6siXRMTk0LbjwZbV82ocrXrvox2rplrY3GueXEtBaDuggTBOtqfBZ9H9DYmMRiY3ZYC0kA1e8TbRoBA5hdjo7ohmGBSYmBWBNTAJOa6xdMDiB5rtiw1xRuOsq2tNv6dfDsBwWagBSrqiIiAiIgIiICIiAoUqEBERAXL3auGjj6zK6ioOb2ncwfEBTCYaiFgWreWrAhSKW0bIx9XMBOtj4iqqYnRLD+08cnT6rqOCjdV4tMdpV5Ycn+5m++/+X5LJvQuHmXu5u+S6kJCc8kVhUw9kYyrGNB1iT4lbAKraQoDVWZme60RrsljVLG9to/EPKq2MasmDtt5/AqEumpUKVVUREQEREBERAREQFClQgIiICpY/tHuV1UNpxBvtbPaIMNkAuANY1iVMAoKyDDoViWHQ+ClLWQsYWxwOiwPJSMUSFJCgRCgBSWqQgyCz2cdscifRAzmp2cjrC2ahuWQJ11Ql0URFVAiIgIiICIiAiIgKFKhAREQFyem+ihjhp3nMewyxwyJBC6yKJjY8D0ztfS2zM3sPCZtLR7RJG8BqGggnjQlcLA/tUxd8YWLsLmPNwcQYcngcSAPFfVXYeYMeY/JasfZg8br2MePxAHycCprqI0mZ3Lxj/tm679jeG1l3X4JAi81HkVX/AMQtlHtM3f8A34BpqAHyvRYv2R2M0GzYbb+wDh3v7BCp432I2Nx/VvE/jcfWVXz77wturlf4j7HTMf6uGPKVj/iVsZo1ocdOsaF02/YDY5ncf4j5K2z7G7LUFjzP43j/AIkJq/yiZq5bPta97DiM2Zm6M347B/1XEd/aPtRxeowNhZjOt+jxusE6FzBA5Er22F9k9jbH/jMcWkEF43yCMwXkkLsYOzBghjWsGjQAPACErzRvmnZMx7PI7EelNob+mazZQbhrmucOEgn4L1HRWw9UwM3i6M3XqZ9Srow9arNIrETtG+mkoiKyBERAREQEREBERAUIiAiIgIiICIiAoREQBSEREiBEQSiIgIiICIiAiIgIiIP/2Q==',
	turnDuration: 3,
	allowMultiple: false,

	onApply(player) {
		player.bonusDefense += 10;
	},
	onRemove(player) {
		player.bonusDefense -= 10;
	}
};
