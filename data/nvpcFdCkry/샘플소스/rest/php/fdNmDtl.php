<?php
error_reporting(E_ALL);
ini_set("display_errors", 1);
?>

<html>
<head>
<meta http-dquiv="Content-Type" content="text/html" charset="utf-8">
<title>향토음식</title>
</head>
<body>
<h4><strong> * 샘플화면은 디자인을 적용하지 않았으니, 개별 사이트의 스타일에 맞게 코딩하시기 바랍니다.</strong></h4>
<h3><strong>향토음식</strong></h3>
<hr>
<?PHP
//이달의음식 상세조회
if(isset($_REQUEST["cntntsNo"])){
	//apiKey - 농사로 Open API에서 신청 후 승인되면 확인 가능
	$apiKey = "발급받은인증키를삽입하세요";
	//서비스 명
	$serviceName = "nvpcFdCkry";
	//오퍼레이션 명
	$operationName = "fdNmDtl";

	//XML 받을 URL 생성
	$parameter = "/".$serviceName."/".$operationName;
	$parameter .= "?apiKey=".$apiKey;

	if($_REQUEST["cntntsNo"]!=NULL){
		$parameter .= "&cntntsNo=";
		$parameter .= $_REQUEST["cntntsNo"];
	}

	$url = "http://api.nongsaro.go.kr/service" . $parameter;

	//XML Parsing
	$xml = file_get_contents($url);
	//PHP5.x 이상이 설치되어 있어야 하며, php.ini에 allow_url_fopen을 on으로 해주시기 바랍니다.
	$object = simplexml_load_string($xml);

	//음식명
	$trditfdNm = $object->body[0]->item[0]->trditfdNm;
	//식품유형
	$foodTyCodeFullname = $object->body[0]->item[0]->foodTyCodeFullname;
	//조리법
	$ckryCodeFullname = $object->body[0]->item[0]->ckryCodeFullname;
	//식재료
	$fdmtInfo = $object->body[0]->item[0]->fdmtInfo;
	//부재료
	$asstnMatrlInfo = $object->body[0]->item[0]->asstnMatrlInfo;
	//조리방법
	$stdCkryDtl = $object->body[0]->item[0]->stdCkryDtl;
	//조리시연자
	$ckngDmprDtl = $object->body[0]->item[0]->ckngDmprDtl;
	//참고사항
	$referMatterDtl = $object->body[0]->item[0]->referMatterDtl;
	//출처
	$originDtl = $object->body[0]->item[0]->originDtl;
	//정보제공자
	$infoOfferInfo = $object->body[0]->item[0]->infoOfferInfo;
	//이미지구분코드
	$rtnImgSeCode = $object->body[0]->item[0]->rtnImgSeCode;
	//이미지 경로
	$rtnFileCours = $object->body[0]->item[0]->rtnFileCours;
	//이미지 물리명
	$rtnStreFileNm = $object->body[0]->item[0]->rtnStreFileNm;
?>
<h2>전통향토음식 상세</h2>
	<div>
	<ul>
<?PHP

	$rtnFileCoursArr = explode('|',$rtnFileCours);
	$rtnStreFileNmArr = explode('|',$rtnStreFileNm);
	$rtnImgSeCodeArr = explode('|',$rtnImgSeCode);
	$rtnImgSeCodeCnt = count($rtnImgSeCodeArr);
	for($k=0; $k < $rtnImgSeCodeCnt; $k++){

		if("209006" == $rtnImgSeCodeArr[$k]){
			$imgUrl = "http://www.nongsaro.go.kr/"+ $rtnFileCoursArr[$k] +"/"+ $rtnStreFileNmArr[$k];
?>
			<li style="width: 33%;display: inline-block;">
			<img src="<?=$imgUrl?>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</li>
<?PHP
		}

	}

	for($k=0; $k < $rtnImgSeCodeCnt; $k++){

		if("209007" == $rtnImgSeCodeArr[$k] || "209005" == $rtnImgSeCodeArr[$k]){
			$imgUrl = "http://www.nongsaro.go.kr/"+ $rtnFileCoursArr[$k] +"/"+ $rtnStreFileNmArr[$k];
?>
			<li style="width: 33%;display: inline-block;">
			<img src="<?=$imgUrl?>" alt=""  title="" style="width: 249px;height: 198px;"/>
			</li>
<?PHP
		}

	}
?>
	</ul>
	</div>
	<!-- //이미지 갤러리 영역 -->
	<div>
		<!-- 내용 -->

		<table border="1" cellSpacing="0" cellPadding="0">
			<colgroup>
				<col style="width:20%" />
				<col/>
			</colgroup>
			<tbody>
				<tr>
					<td class="txt-c">음식명</td>
					<td align="center"><?=$trditfdNm?></td>
				</tr>
				<tr>
					<td class="txt-c">식품유형</td>
					<td align="center"><?=$foodTyCodeFullname?></td>
				</tr>
				<tr>
					<td class="txt-c">조리법</td>
					<td align="center"><?=$ckryCodeFullname?></td>
				</tr>
				<tr>
					<td class="txt-c">식재료</td>
					<td align="center"><?=$fdmtInfo?></td>
				</tr>
				<tr>
					<td class="txt-c">부재료</td>
					<td align="center"><?=$asstnMatrlInfo?></td>
				</tr>
				<tr>
					<td class="txt-c">조리방법</td>
					<td align="center"><?=$stdCkryDtl?></td>
				</tr>
				<tr>
					<td class="txt-c">조리시연자</td>
					<td align="center"><?=$ckngDmprDtl?></td>
				</tr>
				<tr>
					<td class="txt-c">참고사항</td>
					<td align="center"><?=$referMatterDtl?></td>
				</tr>
				<tr>
					<td class="txt-c">출처</td>
					<td align="center"><?=$originDtl?></td>
				</tr>
				<tr>
					<td class="txt-c">정보제공자</td>
					<td align="center"><?=$infoOfferInfo?></td>
				</tr>

		</table>
		<!--// 내용 -->
	</div>

<?PHP
}
?>
<br>
<input type="button" onclick="javascript:location.href='fdNmLst.php'" value="처음화면으로"/>&nbsp;
</body>
</html>